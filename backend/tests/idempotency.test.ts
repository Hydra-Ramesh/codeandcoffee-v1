import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Idempotency Middleware Suite', () => {
  const app = createApp();

  it('GET requests should bypass idempotency checks without error', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Idempotency-Key', 'test-get-key-1');

    expect(res.status).toBe(200);
    expect(res.headers['idempotent-replay']).toBeUndefined();
  });

  it('Mutations with invalid body should be cached with Idempotency-Key and replayed', async () => {
    const uniqueKey = `idemp-test-${Date.now()}-${Math.random()}`;

    // First request with key
    const res1 = await request(app)
      .post('/api/v1/auth/register')
      .set('Idempotency-Key', uniqueKey)
      .send({ email: 'bad-email' }); // Missing required fields

    expect(res1.status).toBe(400);

    // Allow async cache write to finalize
    await new Promise((r) => setTimeout(r, 100));

    // Second request with SAME key should return the replayed response with header
    const res2 = await request(app)
      .post('/api/v1/auth/register')
      .set('Idempotency-Key', uniqueKey)
      .send({ email: 'bad-email' });

    expect(res2.status).toBe(400);
    expect(res2.headers['idempotent-replay']).toBe('true');
  });

  it('Mutations without Idempotency-Key should proceed normally without caching', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({});

    expect(res.status).toBe(400);
    expect(res.headers['idempotent-replay']).toBeUndefined();
  });
});
