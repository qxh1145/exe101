import { BadRequestError } from './custom-errors.js';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Validate req.body against schema
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        // Collect all error messages
        const issues = error.errors || error.issues || [];
        const messages = issues.map((e) => `${(e.path || []).join('.')}: ${e.message}`).join(', ');
        next(new BadRequestError(`Validation failed: ${messages}`, 'VALIDATION_ERROR'));
      } else {
        next(error);
      }
    }
  };
};
