import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../core/response-formatter.js';

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.registerUser(req.body);
    setCookies(res, accessToken, refreshToken);
    return sendSuccess(res, { user }, null, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.loginUser(req.body);
    setCookies(res, accessToken, refreshToken);
    return sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user?.id) {
      await authService.logoutUser(req.user.id);
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    // req.user is set by authMiddleware
    return sendSuccess(res, { user: req.user });
  } catch (error) {
    next(error);
  }
};
