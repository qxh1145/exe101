import { verifyAccessToken } from '../utils/token.js';
import { UnauthorizedError } from './custom-errors.js';
import prisma from '../config/prisma.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      throw new UnauthorizedError('Authentication required', 'NO_TOKEN');
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Fetch user to verify currentSessionId for Single Device Login
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { currentSessionId: true, role: true }
    });

    if (!user) {
      throw new UnauthorizedError('User not found', 'USER_NOT_FOUND');
    }

    // Single device enforcement
    if (user.currentSessionId !== decoded.sessionId) {
      throw new UnauthorizedError('Session expired. You logged in on another device.', 'SESSION_REVOKED');
    }

    // Attach user payload to request
    req.user = {
      id: decoded.userId,
      role: user.role,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Token expired', 'TOKEN_EXPIRED'));
    } else if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('Invalid token', 'INVALID_TOKEN'));
    } else {
      next(error);
    }
  }
};
