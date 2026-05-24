import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/prisma.js';

describe('Auth API Endpoints', () => {
  const testUser = {
    email: `test_auth_${Date.now()}@example.com`,
    password: 'password123',
  };

  beforeAll(async () => {
    const user = await prisma.user.findUnique({ where: { email: testUser.email } });
    if (user) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
      if (wallet) {
        await prisma.ledgerEntry.deleteMany({ where: { walletId: wallet.id } });
        await prisma.wallet.delete({ where: { id: wallet.id } });
      }
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email: testUser.email } });
    if (user) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
      if (wallet) {
        await prisma.ledgerEntry.deleteMany({ where: { walletId: wallet.id } });
        await prisma.wallet.delete({ where: { id: wallet.id } });
      }
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.password).toBeUndefined(); // Password should not be returned
  });

  it('should login the user and return a token via cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send(testUser);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email);

    // Check if token cookie is set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((cookie) => cookie.startsWith('accessToken='))).toBe(true);
  });

  it('should fail registration with an existing email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Email already in use');
  });

  it('should fail login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Invalid credentials');
  });
});
