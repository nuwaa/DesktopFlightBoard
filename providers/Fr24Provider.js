const { ipcRenderer } = require('electron');
const FlightDataProvider = require('./FlightDataProvider');

/**
 * Reads departure and arrival boards from FlightRadar24.
 *
 * The request itself happens in the main process -- see main.js for why -- so
 * this is the renderer half: it asks over IPC and shapes the reply for the
 * board.
 */
class Fr24Provider extends FlightDataProvider {
  constructor() {
    super();
    this.flights = [];
    this.airportCode = 'HND';
    this.mode = 'departures'; // 'departures' | 'arrivals'
  }

  setAirport(code) {
    this.airportCode = code;
  }

  setMode(mode) {
    this.mode = mode;
  }

  async init() {
    console.log(`Initializing Fr24Provider for ${this.airportCode} (${this.mode})...`);
    // Initial fetch is now handled by updateBoard() directly
  }

  async fetchFlights() {
    const rawFlights = await ipcRenderer.invoke('flights:fetch', {
      airport: this.airportCode,
      mode: this.mode
    });

    // Convert Unix timestamps to Date objects
    const now = new Date();
    this.flights = rawFlights.map(f => ({
      ...f,
      scheduleTime: new Date(f.scheduleTime * 1000),
      estimatedTime: f.estimatedTime ? new Date(f.estimatedTime * 1000) : null,
      // Fallback codeshare processing - in FR24 we only get codeshare flight
      // number, so we guess the airline code (usually first two chars)
      codeshareAirline: f.codeshareNumber ? { code: f.codeshareNumber.substring(0, 2) } : null
    }));

    // Filter out flights that already departed / landed more than 1 hour ago
    this.flights = this.flights.filter(f => {
      const timeToCheck = f.estimatedTime || f.scheduleTime;
      return (now.getTime() - timeToCheck.getTime()) < 60 * 60000;
    });

    // Sort by schedule time
    this.flights.sort((a, b) => a.scheduleTime - b.scheduleTime);

    return this.flights;
  }
}

module.exports = Fr24Provider;
