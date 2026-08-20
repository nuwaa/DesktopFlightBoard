const { exec } = require('child_process');
const path = require('path');
const FlightDataProvider = require('./FlightDataProvider');

class HanedaApiProvider extends FlightDataProvider {
  constructor() {
    super();
    this.flights = [];
    const isWindows = process.platform === 'win32';
    const projectRoot = path.join(__dirname, '..');
    this.pythonCommand = path.join(projectRoot, 'venv', isWindows ? 'Scripts' : 'bin', isWindows ? 'python.exe' : 'python3');
    this.scriptPath = path.join(projectRoot, 'python_scripts', 'fetch_flights.py');
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
    console.log(`Initializing HanedaApiProvider (FlightRadarAPI) for ${this.airportCode} (${this.mode})...`);
    // Initial fetch is now handled by updateBoard() directly
  }

  async fetchFlights() {
    return new Promise((resolve, reject) => {
      // Execute the python script
      exec(`"${this.pythonCommand}" "${this.scriptPath}" "${this.airportCode}" "${this.mode}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return reject(error);
        }
        
        try {
          const rawFlights = JSON.parse(stdout);
          
          // Convert Unix timestamps to Date objects
          const now = new Date();
          this.flights = rawFlights.map(f => {
            return {
              ...f,
              scheduleTime: new Date(f.scheduleTime * 1000),
              estimatedTime: f.estimatedTime ? new Date(f.estimatedTime * 1000) : null,
              // Fallback codeshare processing - in FR24 we only get codeshare flight number,
              // so we guess the airline code (usually first two chars)
              codeshareAirline: f.codeshareNumber ? { code: f.codeshareNumber.substring(0, 2) } : null
            };
          });

          // Filter out flights that already departed / landed more than 1 hour ago
          this.flights = this.flights.filter(f => {
            const timeToCheck = f.estimatedTime || f.scheduleTime;
            return (now.getTime() - timeToCheck.getTime()) < 60 * 60000;
          });

          // Sort by schedule time
          this.flights.sort((a, b) => a.scheduleTime - b.scheduleTime);
          
          resolve(this.flights);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Raw Output:', stdout);
          reject(parseError);
        }
      });
    });
  }
}

module.exports = HanedaApiProvider;
