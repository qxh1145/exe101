import * as userService from '../services/user.service.js';
import { sendSuccess } from '../core/response-formatter.js';

export const updateProfileHandler = async (req, res, next) => {
  try {
    const userId = req.user.id; // from authMiddleware
    const data = req.body;
    
    const updatedUser = await userService.updateProfile(userId, data);
    
    return sendSuccess(res, updatedUser);
  } catch (error) {
    next(error);
  }
};
