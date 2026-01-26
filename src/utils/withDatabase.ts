import { NextFunction, Request, Response } from 'express';
import Database, { DatabaseClient } from '../service/database/index.js';

/**
 * Middleware to handle database connection and release automatically
 * @param {function} controller - The controller function to wrap
 * @returns {function} - The wrapped controller function
 */
function WithDatabase(controller: (req: Request, res: Response, next: NextFunction, db: DatabaseClient) => Promise<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const db = await Database.getConnection();
    try {
      await controller(req, res, next, db);
    } catch (error) {
      next(error);
    } finally {
      db.release();
    }
  };
}

export default WithDatabase;
