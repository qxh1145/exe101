import prisma from '../config/prisma.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateAccessToken, generateRefreshToken } from '../utils/token.js';
import { ConflictError, UnauthorizedError } from '../core/custom-errors.js';
import { randomUUID } from 'crypto';

/**
 * Registers a new user, creates a wallet, and adds 50 locked points via transaction.
 */
export const registerUser = async ({ email, password }) => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError('Email already in use', 'EMAIL_IN_USE');
  }

  const hashedPassword = await hashPassword(password);
  const sessionId = randomUUID();

  // Perform atomic transaction
  const user = await prisma.$transaction(async (tx) => {
    // 1. Create User
    const newUser = await tx.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        currentSessionId: sessionId,
        role: 'USER',
        onboardingStatus: 'PENDING',
      },
    });

    // 2. Create Wallet
    const wallet = await tx.wallet.create({
      data: {
        userId: newUser.id,
        cachedBalance: 0,
        pendingBalance: 50, // Starter points start in pending until onboarding is complete
      },
    });

    // 3. Create Ledger Entry
    await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        type: 'STARTER_LOCKED_RELEASE',
        status: 'PENDING',
        amount: 50,
      },
    });

    return newUser;
  });

  // Generate tokens
  const payload = { userId: user.id, sessionId };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return { user: { id: user.id, email: user.email, onboardingStatus: user.onboardingStatus }, accessToken, refreshToken };
};

/**
 * Authenticates user and generates new session ID for single-device enforcement.
 */
export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  // Generate new session ID, revoking previous sessions
  const newSessionId = randomUUID();
  await prisma.user.update({
    where: { id: user.id },
    data: { currentSessionId: newSessionId },
  });

  const payload = { userId: user.id, sessionId: newSessionId };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return { user: { id: user.id, email: user.email, onboardingStatus: user.onboardingStatus }, accessToken, refreshToken };
};

export const logoutUser = async (userId) => {
  // Clear the current session ID to invalidate any existing tokens
  await prisma.user.update({
    where: { id: userId },
    data: { currentSessionId: null },
  });
};
