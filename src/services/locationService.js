const Location = require('../models/Location');
const User = require('../models/User');
const googleMapsService = require('./googleMapsService');
const logger = require('../utils/logger');

class LocationService {
  /**
   * Search for locations
   * @param {string} firebaseUid - Firebase UID of the user
   * @param {string} query - Search query
   * @param {Object} userLocation - User's location {latitude, longitude}
   * @returns {Object} Search results
   */
  static async searchLocations(firebaseUid, query, userLocation = null) {
    try {
      // Get user from database
      const user = await User.findByFirebaseUid(firebaseUid);
      if (!user) {
        throw new Error('User not found');
      }

      logger.info('Location search started', {
        userId: user.id,
        firebaseUid,
        query,
        userLocation
      });

      // Step 1: Search user's saved locations first (using fuzzy search)
      const savedLocations = await Location.findByUserIdAndQuery(user.id, query);

      logger.info('Found saved locations', {
        userId: user.id,
        query,
        savedCount: savedLocations.length
      });

      // Step 2: If we have good fuzzy matches (e.g., >= 3 results), return them
      if (savedLocations.length >= 3) {
        const transformedSaved = savedLocations.map(location => this.transformLocationForResponse(location));

        return {
          success: true,
          data: {
            locations: transformedSaved,
            searchQuery: query,
            userLocation,
            source: 'saved_locations',
            fuzzySearch: true
          }
        };
      }

      // Step 3: Search Google Maps API for additional results
      let googleResults = [];
      if (googleMapsService.isConfigured()) {
        try {
          googleResults = await googleMapsService.searchPlaces(query, userLocation);

          logger.info('Google Maps search completed', {
            userId: user.id,
            query,
            googleResultsCount: googleResults.length
          });
        } catch (error) {
          logger.warn('Google Maps search failed, continuing with saved locations', {
            userId: user.id,
            query,
            error: error.message
          });
        }
      }

      // Step 4: Store new Google results in database
      let newLocations = [];
      if (googleResults.length > 0) {
        const locationsToStore = googleResults.map(place => ({
          ...place,
          user_id: user.id
        }));

        try {
          await Location.createMultiple(locationsToStore);
          newLocations = googleResults;
          
          logger.info('Stored new locations', {
            userId: user.id,
            query,
            storedCount: locationsToStore.length
          });
        } catch (error) {
          logger.error('Failed to store new locations', {
            userId: user.id,
            query,
            error: error.message
          });
        }
      }

      // Step 5: Combine and return results
      const allLocations = [...savedLocations, ...newLocations];
      
      // Remove duplicates based on name and address
      const uniqueLocations = this.removeDuplicates(allLocations);
      
      // Transform for response
      const transformedLocations = uniqueLocations.map(location =>
        this.transformLocationForResponse(location, savedLocations.some(saved => saved.google_place_id === location.google_place_id))
      );

      logger.info('Location search completed', {
        userId: user.id,
        query,
        totalResults: transformedLocations.length,
        savedCount: savedLocations.length,
        googleCount: googleResults.length
      });

      return {
        success: true,
        data: {
          locations: transformedLocations,
          searchQuery: query,
          userLocation,
          source: 'combined'
        }
      };

    } catch (error) {
      logger.error('Location search failed', {
        firebaseUid,
        query,
        userLocation,
        error: error.message
      });
      throw new Error(`Failed to search locations: ${error.message}`);
    }
  }



  /**
   * Transform location data for API response
   * @param {Object} location - Location data from database or Google Maps API
   * @param {boolean} isSaved - Whether this is a saved location
   * @returns {Object} Transformed location
   */
  static transformLocationForResponse(location, isSaved = false) {
    // Safely parse JSON fields
    const parseJsonField = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (e) {
          // If it's a comma-separated string, split it
          if (field.includes(',')) {
            return field.split(',').map(item => item.trim());
          }
          // Return as single item array
          return [field];
        }
      }
      return [];
    };

    const response = {
      id: location.id,
      name: location.name,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      types: parseJsonField(location.types),
      isSaved: isSaved
    };

    // Include relevance score if it exists (from fuzzy search)
    if (location.relevance_score !== undefined) {
      response.relevanceScore = location.relevance_score;
    }

    return response;
  }

  /**
   * Remove duplicate locations based on google_place_id
   * @param {Array} locations - Array of locations
   * @returns {Array} Array with duplicates removed
   */
  static removeDuplicates(locations) {
    const seen = new Set();
    return locations.filter(location => {
      const key = location.google_place_id;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }


}

module.exports = LocationService;
