import type { NextFunction, Request, Response } from 'express';
import Database from '@/service/database/index.js';
import type { DatabaseClient } from '@/service/database/index.js';


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
