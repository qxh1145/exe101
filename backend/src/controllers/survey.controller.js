import * as surveyService from '../services/survey.service.js';
import { sendSuccess } from '../core/response-formatter.js';
import { ForbiddenError } from '../core/custom-errors.js';

export const getMarketplaceFeedHandler = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (user.onboardingStatus !== 'COMPLETED') {
      throw new ForbiddenError('You must complete onboarding to access the marketplace');
    }

    const surveys = await surveyService.getMarketplaceSurveys(user);
    
    return sendSuccess(res, { surveys });
  } catch (error) {
    next(error);
  }
};
