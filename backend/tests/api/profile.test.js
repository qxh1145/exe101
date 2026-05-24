import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/prisma.js';

describe('Profile API Endpoints', () => {
  const testUser = {
    email: `test_profile_${Date.now()}@example.com`,
    password: 'password123',
  };

  let tokenCookie = '';

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

    // Create user and get token
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send(testUser);

    const cookies = loginRes.headers['set-cookie'];
    tokenCookie = cookies.find(c => c.startsWith('accessToken=')).split(';')[0];
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

  it('should update demographic profile and set status to COMPLETED', async () => {
    const res = await request(app)
      .put('/api/v1/users/profile')
      .set('Cookie', [tokenCookie])
      .send({
        major: 'Computer Science',
        year: 3,
        age: 21,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.major).toBe('Computer Science');
    expect(res.body.data.year).toBe(3);
    expect(res.body.data.age).toBe(21);
    expect(res.body.data.onboardingStatus).toBe('COMPLETED');
  });

  it('should fail if missing required fields', async () => {
    const res = await request(app)
      .put('/api/v1/users/profile')
      .set('Cookie', [tokenCookie])
      .send({
        major: 'IT',
        // missing year and age
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Validation failed');
  });

  it('should fail if unauthenticated', async () => {
    const res = await request(app)
      .put('/api/v1/users/profile')
      .send({
        major: 'IT',
        year: 1,
        age: 18,
      });

    expect(res.status).toBe(401);
  });
});
