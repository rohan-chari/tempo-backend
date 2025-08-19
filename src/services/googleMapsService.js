const logger = require('../utils/logger');

class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
  }

  /**
   * Search for places using Google Places API
   * @param {string} query - Search query
   * @param {Object} userLocation - User's location {latitude, longitude}
   * @returns {Array} Array of places
   */
  async searchPlaces(query, userLocation = null) {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      // Build search URL
      const searchUrl = `${this.baseUrl}/textsearch/json`;
      const params = new URLSearchParams({
        query: query,
        key: this.apiKey,
        type: 'establishment'
      });

      // Add location bias if user location is provided
      if (userLocation && userLocation.latitude && userLocation.longitude) {
        params.append('location', `${userLocation.latitude},${userLocation.longitude}`);
        params.append('radius', '5000'); // 5km radius
      }

      const url = `${searchUrl}?${params.toString()}`;

      logger.info('Google Maps API request', {
        query,
        userLocation,
        url: url.replace(this.apiKey, '***')
      });

      // Make the request
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      // Transform the response and limit to 5 results
      const places = data.results || [];
      const limitedPlaces = places.slice(0, 5);
      const transformedPlaces = limitedPlaces.map(place => this.transformPlaceData(place));

      logger.info('Google Maps API response', {
        query,
        resultsCount: transformedPlaces.length,
        status: data.status
      });

      return transformedPlaces;

    } catch (error) {
      logger.error('Google Maps API request failed', {
        query,
        userLocation,
        error: error.message
      });
      throw new Error(`Failed to search places: ${error.message}`);
    }
  }

  /**
   * Get place details by place ID
   * @param {string} placeId - Google Place ID
   * @returns {Object} Place details
   */
  async getPlaceDetails(placeId) {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const detailsUrl = `${this.baseUrl}/details/json`;
      const params = new URLSearchParams({
        place_id: placeId,
        key: this.apiKey,
        fields: 'place_id,name,formatted_address,geometry,types,rating,price_level,photos'
      });

      const url = `${detailsUrl}?${params.toString()}`;

      logger.info('Google Maps Details API request', {
        placeId,
        url: url.replace(this.apiKey, '***')
      });

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      const place = this.transformPlaceData(data.result);

      logger.info('Google Maps Details API response', {
        placeId,
        placeName: place.name
      });

      return place;

    } catch (error) {
      logger.error('Google Maps Details API request failed', {
        placeId,
        error: error.message
      });
      throw new Error(`Failed to get place details: ${error.message}`);
    }
  }

  /**
   * Transform Google Places API response to our format
   * @param {Object} place - Google Places API place object
   * @returns {Object} Transformed place data
   */
  transformPlaceData(place) {
    return {
      google_place_id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      latitude: place.geometry?.location?.lat || null,
      longitude: place.geometry?.location?.lng || null,
      types: place.types || []
    };
  }

  /**
   * Check if service is properly configured
   * @returns {boolean} True if configured
   */
  isConfigured() {
    return !!this.apiKey;
  }
}

// Create singleton instance
const googleMapsService = new GoogleMapsService();

module.exports = googleMapsService;
