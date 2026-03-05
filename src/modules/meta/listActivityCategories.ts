import { Request, Response, NextFunction } from 'express';
import Constants from '@/config/constant.js';

export async function Controller(req: Request, res: Response, next: NextFunction) {
  return res.status(200).json(Constants.activities.categories);
}