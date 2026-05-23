import { BadRequestError } from './custom-errors.js';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Validate req.body against schema
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        // Collect all error messages
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new BadRequestError(`Validation failed: ${messages}`, 'VALIDATION_ERROR'));
      } else {
        next(error);
      }
    }
  };
};
