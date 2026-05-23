import prisma from '../config/prisma.js';
import { NotFoundError, BadRequestError } from '../core/custom-errors.js';

export const updateProfile = async (userId, data) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      major: data.major,
      year: data.year,
      age: data.age,
      onboardingStatus: 'COMPLETED',
    },
    select: {
      id: true,
      email: true,
      role: true,
      major: true,
      year: true,
      age: true,
      onboardingStatus: true,
    },
  });

  return updatedUser;
};
