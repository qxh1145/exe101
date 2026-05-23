import * as userService from '../services/user.service.js';
import { successResponse } from '../core/response-formatter.js';

export const updateProfileHandler = async (req, res, next) => {
  try {
    const userId = req.user.id; // from authMiddleware
    const data = req.body;
    
    const updatedUser = await userService.updateProfile(userId, data);
    
    return successResponse(res, { user: updatedUser }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};
