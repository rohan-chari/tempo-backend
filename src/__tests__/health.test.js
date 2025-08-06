const request = require('supertest');
const App = require('../app');

describe('Health Controller', () => {
  let app;

  beforeAll(() => {
    app = new App();
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('API is healthy');
      expect(response.body.data).toHaveProperty('status', 'OK');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('environment');
      expect(response.body.data).toHaveProperty('version');
    });
  });

  describe('GET /api/v1/health/detailed', () => {
    it('should return detailed health status', async () => {
      const response = await request(app.getApp())
        .get('/api/v1/health/detailed')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Detailed health status');
      expect(response.body.data).toHaveProperty('status', 'OK');
      expect(response.body.data).toHaveProperty('memory');
      expect(response.body.data).toHaveProperty('platform');
      expect(response.body.data).toHaveProperty('services');
    });
  });
});
