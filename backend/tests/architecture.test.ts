import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { CircuitBreaker } from '../src/utils/circuitBreaker.js';

describe('System Architecture & Reliability Suite', () => {
  const app = createApp();

  describe('Topic 102: Correlation IDs & Tracing', () => {
    it('Should automatically generate X-Request-Id and X-Response-Time headers on requests', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBeDefined();
      expect(typeof res.headers['x-request-id']).toBe('string');
      expect(res.headers['x-response-time']).toBeDefined();
      expect(res.headers['x-response-time']).toMatch(/\d+(\.\d+)?ms/);
    });

    it('Should preserve incoming X-Request-Id header across the middleware pipeline', async () => {
      const customTraceId = 'custom-trace-uuid-12345';
      const res = await request(app)
        .get('/api/v1/health')
        .set('X-Request-Id', customTraceId);

      expect(res.status).toBe(200);
      expect(res.headers['x-request-id']).toBe(customTraceId);
    });

    it('Standardized error responses should include requestId for observability', async () => {
      const customTraceId = 'error-trace-uuid-99999';
      const res = await request(app)
        .get('/api/v1/non-existent-endpoint')
        .set('X-Request-Id', customTraceId);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('requestId', customTraceId);
    });
  });

  describe('Topic 103: Prometheus & OpenMetrics Telemetry', () => {
    it('GET /api/v1/metrics should return Prometheus 0.0.4 text scrape format', async () => {
      const res = await request(app).get('/api/v1/metrics');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.headers['content-type']).toContain('version=0.0.4');

      expect(res.text).toContain('# TYPE process_uptime_seconds gauge');
      expect(res.text).toContain('process_uptime_seconds');
      expect(res.text).toContain('# TYPE http_requests_total counter');
      expect(res.text).toContain('http_requests_total');
      expect(res.text).toContain('database_connection_state');
    });

    it('GET /api/v1/metrics?format=json should return JSON formatted telemetry', async () => {
      const res = await request(app).get('/api/v1/metrics?format=json');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/json');
      expect(res.body).toHaveProperty('uptimeSeconds');
      expect(res.body).toHaveProperty('memory');
      expect(res.body.memory).toHaveProperty('rssBytes');
      expect(res.body.memory).toHaveProperty('heapUsedBytes');
      expect(res.body).toHaveProperty('http');
      expect(res.body.http).toHaveProperty('totalRequests');
      expect(res.body).toHaveProperty('dependencies');
      expect(res.body.dependencies).toHaveProperty('postgresConnected');
    });
  });

  describe('Topic 13: Circuit Breakers for External Services', () => {
    it('Should trip to OPEN state after exceeding failure threshold and execute fallback', async () => {
      const breaker = new CircuitBreaker({
        name: 'test-service',
        failureThreshold: 2,
        resetTimeoutMs: 1000,
        fallback: async () => 'fallback-result',
      });

      expect(breaker.getState()).toBe('CLOSED');

      // Failure 1
      try {
        await breaker.execute(async () => {
          throw new Error('Connection timeout');
        });
      } catch (err: any) {
        expect(err.message).toBe('Connection timeout');
      }
      expect(breaker.getState()).toBe('CLOSED');

      // Failure 2 -> Threshold reached -> Breaker opens and executes fallback
      const result2 = await breaker.execute(async () => {
        throw new Error('Connection reset');
      });
      expect(breaker.getState()).toBe('OPEN');
      expect(result2).toBe('fallback-result');

      // Immediate subsequent call is short-circuited directly to fallback without invoking action
      let invoked = false;
      const result3 = await breaker.execute(async () => {
        invoked = true;
        return 'unexpected';
      });
      expect(invoked).toBe(false);
      expect(result3).toBe('fallback-result');
    });
  });

  describe('Topic 47: Refresh Token Rotation & Family Invalidation', () => {
    const testUser = {
      name: 'Token Rotation Tester',
      email: `rotation-${Date.now()}@example.com`,
      password: 'Password123!',
    };

    let initialRefreshToken = '';
    let rotatedRefreshToken = '';

    it('POST /api/v1/auth/refresh should reject missing token with 401', async () => {
      const res = await request(app).post('/api/v1/auth/refresh').send({});

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Refresh token is required');
    });

    it('POST /api/v1/auth/refresh should reject malformed or invalid refresh token with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid.jwt.token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Login should issue both accessToken and refreshToken', async () => {
      // Register user
      await request(app).post('/api/v1/auth/register').send(testUser);

      // Login
      const res = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      initialRefreshToken = res.body.data.refreshToken;
      expect(initialRefreshToken).toBeDefined();
    });

    it('Valid refresh token should be rotated into new access and refresh token pair', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      rotatedRefreshToken = res.body.data.refreshToken;
      expect(rotatedRefreshToken).not.toBe(initialRefreshToken);
    });

    it('Token Reuse Detection: Reusing old rotated refresh token should trigger family invalidation', async () => {
      // Attacker or stale client attempts to replay the initial refresh token
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken });

      // Must be rejected as reuse attack
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/reuse detected|invalid/i);

      // Because the whole token family was revoked, the rotated token should now also be invalidated
      const subsequentRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: rotatedRefreshToken });

      expect(subsequentRes.status).toBe(401);
    });
  });

  describe('Topic 18: CORS Preflight & Header Whitelisting', () => {
    it('OPTIONS preflight requests should allow Idempotency-Key and X-Request-Id headers', async () => {
      const res = await request(app)
        .options('/api/v1/blogs')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type, idempotency-key, x-request-id');

      expect([200, 204]).toContain(res.status);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      const allowedHeaders = res.headers['access-control-allow-headers']?.toLowerCase();
      expect(allowedHeaders).toContain('idempotency-key');
      expect(allowedHeaders).toContain('x-request-id');
    });
  });
});
