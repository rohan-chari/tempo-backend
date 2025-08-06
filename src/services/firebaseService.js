const admin = require('firebase-admin');
const config = require('../config');
const logger = require('../utils/logger');

class FirebaseService {
  constructor () {
    this.admin = null;
    this.initialized = false;
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initialize () {
    if (this.initialized) {
      return;
    }

    try {
      // Check if Firebase config is provided
      if (!config.firebase.projectId) {
        throw new Error('Firebase configuration is missing. Please check your environment variables.');
      }

      // Initialize Firebase Admin SDK
      this.admin = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          privateKeyId: config.firebase.privateKeyId,
          privateKey: config.firebase.privateKey,
          clientEmail: config.firebase.clientEmail,
          clientId: config.firebase.clientId,
          authUri: config.firebase.authUri,
          tokenUri: config.firebase.tokenUri,
          authProviderX509CertUrl: config.firebase.authProviderX509CertUrl,
          clientX509CertUrl: config.firebase.clientX509CertUrl,
        }),
      });

      this.initialized = true;
      logger.info('Firebase Admin SDK initialized successfully');
    } catch (error) {
      logger.error('Firebase initialization failed:', error);
      throw error;
    }
  }

  /**
   * Verify Firebase ID token
   * @param {string} idToken - Firebase ID token
   * @returns {Object} Decoded token payload
   */
  async verifyIdToken (idToken) {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      const decodedToken = await this.admin.auth().verifyIdToken(idToken);
      logger.info('Firebase token verified successfully', { uid: decodedToken.uid });
      return decodedToken;
    } catch (error) {
      logger.error('Firebase token verification failed:', error);
      throw new Error('Invalid Firebase token');
    }
  }

  /**
   * Get user data from Firebase
   * @param {string} uid - Firebase user ID
   * @returns {Object} User data
   */
  async getUser (uid) {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      const userRecord = await this.admin.auth().getUser(uid);
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified,
      };
    } catch (error) {
      logger.error('Failed to get user from Firebase:', error);
      throw new Error('User not found in Firebase');
    }
  }
}

// Create singleton instance
const firebaseService = new FirebaseService();

module.exports = firebaseService;
