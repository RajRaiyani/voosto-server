import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '@/utils/validationHelper.js';
import ServerError from '@/utils/serverError.js';
import Logger from '@/service/logger/index.js';
import Constants from '@/config/constant.js';

const { errorCodes } = Constants;

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {

  if (err instanceof ValidationError) {

    Logger.warn({ message: 'validation error', stack: JSON.stringify(err.details) });
    return res.status(400).json({ code: 'validation_error', message: err.message, details: err.details });
  }

  if (err instanceof ServerError) {
    const errorInfo = err.info();
    if (errorInfo) return res.status(errorInfo.httpStatusCode).json(errorInfo.body);
  }

  // Postgres error handling
  if (errorCodes.postgres[err.code]) {
    const { httpStatusCode, code, message, constraint } = errorCodes.postgres[err.code];

    return res.status(httpStatusCode).json({
      code,
      message: constraint[err.constraint] || message,
    });
  }

  Logger.error(err.message || err.code, { stack: err.stack });

  return res.status(500).json({
    code: 'internal_server_error',
    message: 'Internal server error',
    details: {
      developer: {
        message: err.message || 'Internal server error',
        stack: err.stack,
      },
    },
  });
};

export default errorHandler;
