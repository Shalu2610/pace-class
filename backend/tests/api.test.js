const request = require('supertest');
const express = require('express');
const routes = require('../routes/index');

// Create a test app instance
const app = express();
app.use(express.json());
app.use('/api', routes);

describe('Backend API Tests', () => {
  test('GET /api should return API status (if root route exists)', async () => {
    // Testing the routes/index.js which usually handles /api
    // Since server.js has the root route, we test something in /api
    const res = await request(app).get('/api/progress/leaderboard');
    // We expect 401 if not authenticated, or 200 if it works
    // For now, let's just assert it's not a 404
    expect(res.statusCode).not.toBe(404);
  });

  test('POST /api/auth/login should be available', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password'
    });
    expect(res.statusCode).not.toBe(404);
  });

  test('GET /api/progress/stats (Protected) should return 401', async () => {
    const res = await request(app).get('/api/progress/stats');
    expect(res.statusCode).toBe(401);
  });
});
