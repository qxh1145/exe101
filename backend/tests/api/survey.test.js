import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/prisma.js';

describe('Survey API Endpoints - Marketplace', () => {
  const publisherData = {
    email: `publisher_${Date.now()}@example.com`,
    passwordHash: 'hashed',
    onboardingStatus: 'COMPLETED'
  };

  const respondentData = {
    email: `respondent_${Date.now()}@example.com`,
    password: 'password123',
    major: 'Software Engineering',
    year: 3,
    age: 21,
    onboardingStatus: 'COMPLETED'
  };

  const pendingRespondentData = {
    email: `pending_${Date.now()}@example.com`,
    password: 'password123',
    onboardingStatus: 'PENDING'
  };

  let tokenCookie = '';
  let pendingTokenCookie = '';
  let publisherId = '';
  let respondentId = '';
  let surveyList = [];

  beforeAll(async () => {
    // Create publisher
    const publisher = await prisma.user.create({ data: publisherData });
    publisherId = publisher.id;

    // Create surveys
    const surveys = [
      { // 0: Match all
        title: 'Survey 1 - Match',
        url: 'http://form.com/1',
        completionCode: 'code1',
        targetCount: 10,
        bounty: 10,
        estimatedTime: 5,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 100000000), // Future
        publisherId
      },
      { // 1: Expired
        title: 'Survey 2 - Expired',
        url: 'http://form.com/2',
        completionCode: 'code2',
        targetCount: 10,
        bounty: 10,
        estimatedTime: 5,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() - 100000000), // Past
        publisherId
      },
      { // 2: Wrong Major
        title: 'Survey 3 - Wrong Major',
        url: 'http://form.com/3',
        completionCode: 'code3',
        targetCount: 10,
        bounty: 10,
        estimatedTime: 5,
        targetMajor: 'Marketing',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 100000000), // Future
        publisherId
      },
      { // 3: Match Demographic exactly
        title: 'Survey 4 - Exact Match',
        url: 'http://form.com/4',
        completionCode: 'code4',
        targetCount: 10,
        bounty: 20,
        estimatedTime: 10,
        targetMajor: 'Software Engineering',
        targetYear: 3,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 100000000), // Future
        publisherId
      },
    ];

    for (const data of surveys) {
      const s = await prisma.survey.create({ data });
      surveyList.push(s);
    }

    // Register Respondent
    await request(app).post('/api/v1/auth/register').send(pendingRespondentData);
    const pendRes = await request(app).post('/api/v1/auth/login').send(pendingRespondentData);
    pendingTokenCookie = pendRes.headers['set-cookie'].find(c => c.startsWith('accessToken=')).split(';')[0];

    // Register & Complete Onboarding for Respondent
    await request(app).post('/api/v1/auth/register').send(respondentData);
    const resLogin = await request(app).post('/api/v1/auth/login').send(respondentData);
    tokenCookie = resLogin.headers['set-cookie'].find(c => c.startsWith('accessToken=')).split(';')[0];

    respondentId = resLogin.body.data.user.id;

    await request(app)
      .put('/api/v1/users/profile')
      .set('Cookie', [tokenCookie])
      .send({ major: respondentData.major, year: respondentData.year, age: respondentData.age });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.surveySession.deleteMany({ where: { surveyId: { in: surveyList.map(s => s.id) } } });
    await prisma.survey.deleteMany({ where: { publisherId } });
    
    for (const email of [publisherData.email, respondentData.email, pendingRespondentData.email]) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
        if (wallet) {
          await prisma.ledgerEntry.deleteMany({ where: { walletId: wallet.id } });
          await prisma.wallet.delete({ where: { id: wallet.id } });
        }
        await prisma.user.delete({ where: { id: user.id } });
      }
    }
  });

  it('should deny access if onboarding is not completed', async () => {
    const res = await request(app)
      .get('/api/v1/surveys/marketplace')
      .set('Cookie', [pendingTokenCookie]);

    expect(res.status).toBe(403);
    expect(res.body.error.message).toContain('You must complete onboarding to access the marketplace');
  });

  it('should return only active, unexpired surveys matching demographic profile', async () => {
    const res = await request(app)
      .get('/api/v1/surveys/marketplace')
      .set('Cookie', [tokenCookie]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    const returnedTitles = res.body.data.surveys.map(s => s.title);
    
    // Should include Survey 1 and Survey 4
    expect(returnedTitles).toContain('Survey 1 - Match');
    expect(returnedTitles).toContain('Survey 4 - Exact Match');
    
    // Should NOT include Survey 2 (expired) and Survey 3 (wrong major)
    expect(returnedTitles).not.toContain('Survey 2 - Expired');
    expect(returnedTitles).not.toContain('Survey 3 - Wrong Major');
  });

  it('should exclude surveys the user has already participated in', async () => {
    // Simulate user starting Survey 1
    await prisma.surveySession.create({
      data: {
        userId: respondentId,
        surveyId: surveyList[0].id,
        status: 'IN_PROGRESS'
      }
    });

    const res = await request(app)
      .get('/api/v1/surveys/marketplace')
      .set('Cookie', [tokenCookie]);

    expect(res.status).toBe(200);
    const returnedTitles = res.body.data.surveys.map(s => s.title);
    
    // Survey 1 should now be excluded
    expect(returnedTitles).not.toContain('Survey 1 - Match');
    // Survey 4 should still be there
    expect(returnedTitles).toContain('Survey 4 - Exact Match');
  });
});
