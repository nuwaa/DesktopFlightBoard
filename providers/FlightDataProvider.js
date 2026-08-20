/**
 * Base interface for Flight Data Providers
 */
class FlightDataProvider {
  /**
   * Initialize the provider
   */
  async init() {
    throw new Error('init() must be implemented');
  }

  /**
   * Fetch the latest flights for the current board (departures or arrivals)
   * @returns {Promise<Array>} Array of flight objects
   */
  async fetchFlights() {
    throw new Error('fetchFlights() must be implemented');
  }
}

module.exports = FlightDataProvider;
