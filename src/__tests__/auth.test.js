const request = require('supertest');
const App = require('../app');

describe('Auth Controller', () => {
  let app;

  beforeAll(() => {
    app = new App();
  });

  describe('POST /api/v1/auth/signin', () => {
    it('should return 400 when no idToken is provided', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/auth/signin')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Firebase ID token is required');
    });

    it('should return 400 when idToken is empty', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/auth/signin')
        .send({ idToken: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Firebase ID token is required');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app.getApp())
        .post('/api/v1/auth/signin')
        .send({ idToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid authentication token');
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should return 401 when no authorization header', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token is required');
    });

    it('should return 401 for invalid authorization header', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token');
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    it('should return 401 when no authorization header', async () => {
      const response = await request(app.getApp())
        .put('/api/v1/auth/profile')
        .send({ display_name: 'Test User' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token is required');
    });

    it('should return 400 when no fields to update', async () => {
      const response = await request(app.getApp())
        .put('/api/v1/auth/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('At least one field is required for update');
    });
  });
}); 