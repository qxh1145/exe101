import prisma from '../config/prisma.js';

export const getMarketplaceSurveys = async (user) => {
  const { major, year, age } = user;

  const surveys = await prisma.survey.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { gt: new Date() },
      AND: [
        { OR: [{ targetMajor: null }, { targetMajor: major || undefined }] },
        { OR: [{ targetYear: null }, { targetYear: year || undefined }] },
        { OR: [{ targetAgeMin: null }, { targetAgeMin: { lte: age || undefined } }] },
        { OR: [{ targetAgeMax: null }, { targetAgeMax: { gte: age || undefined } }] },
      ],
      NOT: {
        sessions: {
          some: { userId: user.id },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      bounty: true,
      estimatedTime: true,
      targetMajor: true,
      targetYear: true,
      targetAgeMin: true,
      targetAgeMax: true,
      targetCount: true,
      expiresAt: true,
      _count: {
        select: {
          sessions: { where: { status: 'COMPLETED' } }
        }
      },
      publisher: {
        select: { email: true }
      }
    }
  });

  return surveys;
};
