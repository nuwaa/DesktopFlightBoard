/**
 * Turns a FlightRadar24 airport payload into the rows a board displays.
 *
 * Pure and free of Electron, so it can be exercised outside the app.
 */

/**
 * Prefix numbered terminals with 'T' (HND "2" -> "T2", NRT "1S" -> "T1S").
 *
 * Some airports report letters instead of numbers -- Kaohsiung (KHH) uses "I"
 * for the international terminal and "D" for the domestic one -- so those are
 * passed through as-is rather than becoming a meaningless "TI"/"TD".
 */
function formatTerminal(terminal) {
  const value = String(terminal || '').trim();
  if (!value) return '';
  return /^[0-9]/.test(value) ? `T${value}` : value;
}

/**
 * @param {object} response the `result.response` object from FR24
 * @param {'departures'|'arrivals'} mode which board to read
 * @returns {Array<object>} one record per flight
 */
function parseBoard(response, mode) {
  const arrivals = mode === 'arrivals';
  const leg = arrivals ? 'arrival' : 'departure';

  const pluginData = response?.airport?.pluginData;
  if (!pluginData) return [];

  const boardData = pluginData.schedule?.[mode]?.data;
  if (!boardData) return [];

  // Fallback UTC offset for this airport, used when a row omits its own.
  const airportOffset = pluginData.details?.timezone?.offset || 0;

  const flights = [];

  for (const item of boardData) {
    const flight = item.flight;
    if (!flight) continue;

    // We only care about flights with schedule times
    const timeInfo = flight.time || {};
    const scheduleTime = timeInfo.scheduled?.[leg];
    if (!scheduleTime) continue;

    let estimatedTime = timeInfo.estimated?.[leg];
    if (arrivals && !estimatedTime) {
      // Once a flight has landed FR24 clears `estimated` and fills `real`, so
      // without this the changed-time column would be blank for every flight
      // already on the ground.
      estimatedTime = timeInfo.real?.[leg];
    }
    if (estimatedTime === scheduleTime) estimatedTime = null;

    // The far end of the flight, and the side of the record that carries this
    // airport's own terminal/gate, swap between the two boards.
    const airports = flight.airport || {};
    const farEnd = arrivals ? airports.origin : airports.destination;
    const nearEnd = arrivals ? airports.destination : airports.origin;

    let city = 'Unknown';
    let destSub = '';
    let destCountry = '';
    if (farEnd) {
      // Try to get city name if available, else use full name or code
      city = farEnd.position?.region?.city || farEnd.name || '';
      destSub = farEnd.code?.iata || '';
      destCountry = farEnd.position?.country?.code || '';
    }

    const airline = flight.airline;
    const airlineName = airline ? airline.name || '' : 'Unknown';
    const airlineCode = airline ? airline.code?.iata || '' : '';

    const identification = flight.identification || {};
    const flightNumber = identification.number?.default || null;

    const codeshares = identification.codeshare;
    const codeshareNumber = codeshares && codeshares.length > 0 ? codeshares[0] : null;

    // Times are UTC epochs, but a board shows *airport local* time, so the
    // renderer needs this airport's offset. FR24 reports it per flight, which
    // keeps it right for airports that observe DST.
    const nearOffset = nearEnd?.timezone?.offset;
    const utcOffset = nearOffset === undefined || nearOffset === null ? airportOffset : nearOffset;

    // Attempt to get terminal and gate at this airport
    const terminal = nearEnd?.info ? nearEnd.info.terminal || '' : '';
    const gate = nearEnd?.info ? nearEnd.info.gate || '' : '';

    // Determine status
    let status = 'ON TIME';
    if (estimatedTime && estimatedTime > scheduleTime + 300) status = 'DELAYED'; // 5 mins late

    // Map FR24 status
    const frStatus = flight.status?.text || '';
    if (frStatus.includes('Boarding')) status = 'BOARDING';
    else if (frStatus.includes('Departed')) status = 'DEPARTED';
    else if (frStatus.includes('Landed')) status = 'LANDED';
    else if (frStatus.includes('Diverted')) status = 'DIVERTED';
    else if (frStatus.includes('Canceled')) status = 'CANCELED';

    flights.push({
      id: identification.id || flightNumber,
      scheduleTime, // Unix timestamp (UTC)
      estimatedTime: estimatedTime || null, // Unix timestamp (UTC) or null
      utcOffset, // seconds east of UTC at this airport
      destination: city,
      destinationSub: destSub,
      destinationCountry: destCountry,
      airline: { name: airlineName, code: airlineCode },
      flightNumber,
      codeshareNumber,
      terminal: formatTerminal(terminal),
      gate: gate || '',
      status
    });
  }

  return flights;
}

module.exports = { parseBoard, formatTerminal };
