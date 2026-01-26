import z from 'zod';
import { Request, Response, NextFunction } from 'express';
import qs from 'qs';

class ValidationError extends Error {
  isJoi: boolean;

  details: any;

  constructor(errorMessage: string, details: any) {
    super('Validation Error');
    this.name = 'ValidationError';
    this.message = errorMessage || 'Validation Error';
    this.isJoi = true;
    this.details = details;
  }
}

function parseQuery(req: Request) {
  const rawQuery = req.url.split('?')[1] || '';
  return qs.parse(rawQuery);
}

const validate = (schema: { [key: string]: z.ZodObject<any, any> }) => (req: Request, res: Response, next: NextFunction) => {
  req.body = req.body || {};

  Object.keys(schema).forEach((key) => {

    const result = key === 'query' ? schema[key].safeParse(parseQuery(req)) : schema[key].safeParse(req[key]);



    if (result.error) {

      const details = { [key]: {} };
      let errorMessage: string;
      result.error.issues.forEach((issue) => {
        details[key][issue.path[0]] = issue.message;
        if (!errorMessage) errorMessage = issue.message;
      });

      throw new ValidationError(errorMessage, details);
    }

    if (key === 'query') {
      (req as Request & { validatedQuery: object }).validatedQuery = result.data;
    } else {
      (req as any)[key] = result.data;
    }

  });
  next();

};

export { validate, ValidationError, z };
