import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // Set system settings
  await prisma.systemSetting.upsert({
    where: { key: 'POINT_TO_VND_RATE' },
    update: {},
    create: { key: 'POINT_TO_VND_RATE', value: '1000' }
  });

  // Clear existing data (optional, useful for dev)
  await prisma.ledgerEntry.deleteMany({});
  await prisma.surveySession.deleteMany({});
  await prisma.fraudLog.deleteMany({});
  await prisma.survey.deleteMany({});
  await prisma.wallet.deleteMany({});
  await prisma.user.deleteMany({});

  // Create 20 Users
  const users = [];
  for (let i = 1; i <= 20; i++) {
    const user = await prisma.user.create({
      data: {
        email: `user${i}@fpt.edu.vn`,
        passwordHash: 'hashed_password_placeholder', // Dummy hash for testing
        role: i === 1 ? 'ADMIN' : 'USER',
        major: ['SE', 'IA', 'GD', 'BA'][Math.floor(Math.random() * 4)],
        year: Math.floor(Math.random() * 4) + 1,
        age: 18 + Math.floor(Math.random() * 5),
        onboardingStatus: 'COMPLETED',
        wallet: {
          create: {
            cachedBalance: Math.floor(Math.random() * 500) + 100,
            pendingBalance: Math.floor(Math.random() * 100),
          }
        }
      }
    });
    users.push(user);
  }

  console.log('20 users created.');

  // Create 50 Surveys
  for (let i = 1; i <= 50; i++) {
    const publisher = users[Math.floor(Math.random() * users.length)];
    
    // Calculate expiration date (some expired, some active)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (Math.random() > 0.8 ? -1 : Math.floor(Math.random() * 7) + 1));

    await prisma.survey.create({
      data: {
        publisherId: publisher.id,
        title: `Survey about FPT Campus Life - ${i}`,
        url: 'https://forms.google.com/sample',
        completionCode: `SECRET_CODE_${i}`,
        targetCount: Math.floor(Math.random() * 50) + 10,
        bounty: Math.floor(Math.random() * 20) + 5,
        estimatedTime: Math.floor(Math.random() * 10) + 2, // 2-12 mins
        status: expiresAt < new Date() ? 'EXPIRED' : 'ACTIVE',
        expiresAt: expiresAt,
        targetMajor: Math.random() > 0.5 ? 'SE' : null,
      }
    });
  }

  console.log('50 surveys created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
