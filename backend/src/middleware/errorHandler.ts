import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

interface AppError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
}

const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose duplicate key error
  if (err.code === 11000 && err.keyValue) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    statusCode = 409;
  }

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    statusCode = 422;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    message = `Invalid ${err.path}: ${err.value}`;
    statusCode = 400;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorHandler;
