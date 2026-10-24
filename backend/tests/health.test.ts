import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Health & Observability Suite', () => {
  const app = createApp();

  it('GET / should return root API status and documentation metadata', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Code & Coffee API');
    expect(res.body).toHaveProperty('status', 'online');
    expect(res.body).toHaveProperty('version', 'v1');
  });

  it('GET /api/v1/health should return 200 with shallow liveness telemetry', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('uptimeSeconds');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('version', '1.0.0');
    expect(res.body).toHaveProperty('service', 'Code & Coffee API');
  });

  it('GET /api/v1/health/deep should probe PostgreSQL, Redis, MongoDB and Memory', async () => {
    const res = await request(app).get('/api/v1/health/deep');

    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('checks');
    expect(res.body.checks).toHaveProperty('postgres');
    expect(res.body.checks).toHaveProperty('redis');
    expect(res.body.checks).toHaveProperty('mongodb');
    expect(res.body).toHaveProperty('system');
    expect(res.body.system).toHaveProperty('memory');
    expect(res.body.system.memory).toHaveProperty('heapUsedMb');
  });

  it('Unknown routes should return standardized 404 response without leaking internals', async () => {
    const res = await request(app).get('/api/v1/non-existent-route-for-testing');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toContain('Resource not found');
  });
});
