import { AppError } from './custom-errors.js';

export const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] [ERROR]`, err.stack || err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
      },
    });
  }

  // Handle generic / unexpected errors
  res.status(500).json({
    success: false,
    error: {
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
};
