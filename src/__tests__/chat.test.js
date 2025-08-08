const request = require('supertest');
const App = require('../app');
const firebaseService = require('../services/firebaseService');

// Mock Firebase service
jest.mock('../services/firebaseService');

describe('Chat API', () => {
  let app;
  let server;

  // Mock user for authentication
  const mockUser = {
    firebase_uid: 'test-uid-123',
    email: 'test@example.com',
  };

  // Mock Firebase token verification
  const mockToken = 'mock-firebase-token';
  const mockDecodedToken = {
    uid: mockUser.firebase_uid,
    email: mockUser.email,
  };

  beforeAll(async () => {
    // Create app instance
    const appInstance = new App();
    app = appInstance.getApp();

    // Mock Firebase methods
    firebaseService.verifyIdToken.mockResolvedValue(mockDecodedToken);
    firebaseService.initialize.mockResolvedValue();
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/chat/message', () => {
    const validMessage = {
      message: 'Hello, how can you help me?',
      context: {
        currentPage: 'dashboard',
        userPreferences: {
          theme: 'dark',
        },
      },
      permissions: {
        calendar: 'granted',
        notifications: 'granted',
      },
    };

    it('should successfully process a chat message', async () => {
      const response = await request(app)
        .post('/api/v1/chat/message')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(validMessage)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Message processed successfully');
      expect(response.body.data).toHaveProperty('message');
      expect(response.body.data).toHaveProperty('type');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('messageId');
      expect(response.body.data).toHaveProperty('metadata');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id', mockUser.firebase_uid);
    });

    it('should handle simple greeting messages', async () => {
      const response = await request(app)
        .post('/api/v1/chat/message')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ message: 'Hello' })
        .expect(200);

      expect(response.body.data.message).toContain('Hello');
    });

    it('should handle calendar-related queries', async () => {
      const response = await request(app)
        .post('/api/v1/chat/message')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ message: 'Can you help me with my calendar?' })
        .expect(200);

      expect(response.body.data.type).toBe('calendar_suggestion');
      expect(response.body.data.metadata).toHaveProperty('suggestedActions');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/chat/message')
        .send(validMessage)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Access token is required');
    });

    it('should require message field', async () => {
      const response = await request(app)
        .post('/api/v1/chat/message')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Message is required');
    });

    it('should reject empty messages', async () => {
      const response = await request(app)
        .post('/api/v1/chat/message')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ message: '   ' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('non-empty string');
    });

    it('should reject messages that are too long', async () => {
      const longMessage = 'a'.repeat(10001);

      const response = await request(app)
        .post('/api/v1/chat/message')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ message: longMessage })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('too long');
    });

    it('should handle invalid permissions gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/chat/message')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({
          message: 'Hello',
          permissions: {
            invalidPermission: 'invalidValue',
          },
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid permissions');
    });

    it('should include context in response metadata when provided', async () => {
      const response = await request(app)
        .post('/api/v1/chat/message')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(validMessage)
        .expect(200);

      expect(response.body.data.metadata).toHaveProperty('contextProcessed', true);
      expect(response.body.data.metadata).toHaveProperty('currentPage', 'dashboard');
    });
  });

  describe('GET /api/v1/chat/history', () => {
    it('should return chat history with default pagination', async () => {
      const response = await request(app)
        .get('/api/v1/chat/history')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('messages');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('limit', 50);
      expect(response.body.data.pagination).toHaveProperty('offset', 0);
    });

    it('should handle custom pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/chat/history?limit=25&offset=10')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.data.pagination).toHaveProperty('limit', 25);
      expect(response.body.data.pagination).toHaveProperty('offset', 10);
    });

    it('should reject invalid limit values', async () => {
      const response = await request(app)
        .get('/api/v1/chat/history?limit=150')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(400);

      expect(response.body.message).toContain('between 1 and 100');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/chat/history')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/v1/chat/history', () => {
    it('should clear chat history', async () => {
      const response = await request(app)
        .delete('/api/v1/chat/history')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('cleared', true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/v1/chat/history')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/v1/chat/status', () => {
    it('should return chat service status', async () => {
      const response = await request(app)
        .get('/api/v1/chat/status')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('service', 'chat');
      expect(response.body.data).toHaveProperty('status', 'healthy');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('features');
      expect(response.body.data.features).toHaveProperty('messageProcessing', true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/chat/status')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Authentication Edge Cases', () => {
    it('should handle invalid Firebase token', async () => {
      firebaseService.verifyIdToken.mockRejectedValueOnce(new Error('Invalid Firebase token'));

      const response = await request(app)
        .post('/api/v1/chat/message')
        .set('Authorization', 'Bearer invalid-token')
        .send({ message: 'Hello' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Invalid or expired token');
    });

    it('should handle Firebase service errors', async () => {
      firebaseService.verifyIdToken.mockRejectedValueOnce(new Error('Firebase service error'));

      const response = await request(app)
        .post('/api/v1/chat/message')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ message: 'Hello' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
