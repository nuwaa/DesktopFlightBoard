#!/usr/bin/env python3
import json
import sys
import warnings

# Suppress DeprecationWarnings from FlightRadarAPI (like the one we saw in testing)
warnings.filterwarnings("ignore", category=DeprecationWarning)

try:
    from FlightRadarAPI import FlightRadar24API
except ImportError:
    # Fallback if someone uses old name
    from FlightRadar24 import FlightRadar24API


def format_terminal(terminal):
    """Prefix numbered terminals with 'T' (HND "2" -> "T2", NRT "1S" -> "T1S").

    Some airports report letters instead of numbers -- Kaohsiung (KHH) uses
    "I" for the international terminal and "D" for the domestic one -- so those
    are passed through as-is rather than becoming a meaningless "TI"/"TD".
    """
    terminal = str(terminal or "").strip()
    if not terminal:
        return ""
    return f"T{terminal}" if terminal[0].isdigit() else terminal


def fetch_flights(airport_code="HND", mode="departures"):
    """Return the departure or arrival board for one airport as JSON.

    The two boards are mirror images of each other, so a single record shape is
    used for both.  In it, "destination*" always means *the other end of the
    flight*: the arrival airport on a departure board, the departure airport on
    an arrival board.  Likewise "terminal"/"gate" are always the ones at
    `airport_code` itself, which FR24 stores on opposite sides of the record.
    """
    arrivals = mode == "arrivals"
    leg = "arrival" if arrivals else "departure"

    fr_api = FlightRadar24API()
    airport_details = fr_api.get_airport_details(airport_code)

    # Check if we got valid data
    if 'airport' not in airport_details or 'pluginData' not in airport_details['airport']:
        print(json.dumps([]))
        return

    plugin_data = airport_details['airport']['pluginData']
    board_data = plugin_data['schedule'][mode]['data']

    # Fallback UTC offset for this airport, used when a row omits its own.
    details = plugin_data.get('details') or {}
    airport_offset = (details.get('timezone') or {}).get('offset') or 0

    flights_list = []

    for item in board_data:
        flight = item['flight']

        # We only care about flights with schedule times
        time_info = flight.get('time') or {}
        scheduled_info = time_info.get('scheduled') or {}
        schedule_time = scheduled_info.get(leg)
        if not schedule_time:
            continue

        estimated_info = time_info.get('estimated') or {}
        estimated_time = estimated_info.get(leg)
        if arrivals and not estimated_time:
            # Once a flight has landed FR24 clears `estimated` and fills `real`,
            # so without this the changed-time column would be blank for every
            # flight already on the ground.
            estimated_time = (time_info.get('real') or {}).get(leg)
        if estimated_time == schedule_time:
            estimated_time = None

        airports = flight.get('airport') or {}
        # The far end of the flight, and the side of the record that carries
        # this airport's own terminal/gate, swap between the two boards.
        far_end = airports.get('origin') if arrivals else airports.get('destination')
        near_end = airports.get('destination') if arrivals else airports.get('origin')

        if far_end:
            far_name = far_end.get('name', '')
            # Try to get city name if available, else use full name or code
            city = far_end.get('position', {}).get('region', {}).get('city')
            if not city:
                city = far_name
            dest_sub = far_end.get('code', {}).get('iata', '')
            dest_country = far_end.get('position', {}).get('country', {}).get('code', '')
        else:
            city = "Unknown"
            dest_sub = ""
            dest_country = ""

        airline = flight.get('airline')
        if airline:
            airline_name = airline.get('name', '')
            airline_code = airline.get('code', {}).get('iata', '')
        else:
            airline_name = "Unknown"
            airline_code = ""

        identification = flight.get('identification') or {}
        number_info = identification.get('number') or {}
        flight_num = number_info.get('default')

        codeshares = identification.get('codeshare')
        codeshare_num = codeshares[0] if codeshares and len(codeshares) > 0 else None

        # Times are UTC epochs, but a board shows *airport local* time, so the
        # renderer needs this airport's offset. FR24 reports it per flight,
        # which keeps it right for airports that observe DST.
        near_tz = (near_end or {}).get('timezone') or {}
        utc_offset = near_tz.get('offset')
        if utc_offset is None:
            utc_offset = airport_offset

        # Attempt to get terminal and gate at this airport
        if near_end and 'info' in near_end:
            terminal = near_end['info'].get('terminal', '')
            gate = near_end['info'].get('gate', '')
        else:
            terminal = ''
            gate = ''

        # Determine status
        status_text = "ON TIME"
        if estimated_time and estimated_time > schedule_time + 300: # 5 mins late
            status_text = "DELAYED"

        # Map FR24 status
        status_info = flight.get('status') or {}
        fr_status = status_info.get('text') or ''
        if "Boarding" in fr_status:
            status_text = "BOARDING"
        elif "Departed" in fr_status:
            status_text = "DEPARTED"
        elif "Landed" in fr_status:
            status_text = "LANDED"
        elif "Diverted" in fr_status:
            status_text = "DIVERTED"
        elif "Canceled" in fr_status:
            status_text = "CANCELED"

        flights_list.append({
            "id": identification.get('id') or flight_num,
            "scheduleTime": schedule_time, # Unix timestamp (UTC)
            "estimatedTime": estimated_time, # Unix timestamp (UTC) or None
            "utcOffset": utc_offset, # seconds east of UTC at this airport
            "destination": city,
            "destinationSub": dest_sub,
            "destinationCountry": dest_country,
            "airline": {
                "name": airline_name,
                "code": airline_code
            },
            "flightNumber": flight_num,
            "codeshareNumber": codeshare_num,
            "terminal": format_terminal(terminal),
            "gate": gate or "",
            "status": status_text
        })

    print(json.dumps(flights_list))

if __name__ == "__main__":
    airport = sys.argv[1] if len(sys.argv) > 1 else "HND"
    board = sys.argv[2] if len(sys.argv) > 2 else "departures"
    if board not in ("departures", "arrivals"):
        board = "departures"
    fetch_flights(airport, board)
