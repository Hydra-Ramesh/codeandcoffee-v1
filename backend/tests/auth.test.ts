import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Authentication & Authorization Suite', () => {
  const app = createApp();
  const testUser = {
    name: 'Vitest Automated Tester',
    email: `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`,
    password: 'Password123!',
  };
  let userToken = '';

  it('Register should reject payload missing required fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: testUser.email });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Register should reject weak passwords (< 6 chars)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Weak Pass User',
        email: 'weakpass@example.com',
        password: '123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Register should trap bots that fill the honeypot field', async () => {
    const botEmail = `bot-${Date.now()}@spammer.org`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Spam Bot',
        email: botEmail,
        password: 'Password123!',
        website_trap: 'http://malicious-spam-domain.com', // Honeypot trap field
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('queued for review');
  });

  it('Register should succeed with valid credentials and set HttpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.user.email).toBe(testUser.email);

    // Verify Set-Cookie header is dispatched with HttpOnly
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('token=');
    expect(cookies[0]).toContain('HttpOnly');

    userToken = res.body.data.accessToken;
  });

  it('Login should reject incorrect password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword999',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Login should succeed with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  it('GET /api/v1/auth/me should reject unauthenticated requests', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me should return user identity with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
  });
});
