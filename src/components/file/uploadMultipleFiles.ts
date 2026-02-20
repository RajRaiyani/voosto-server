import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { RegisterFile } from '@/components/file/file.service.js';


export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'Files are required' });
  }

  const newFiles = await Promise.all(files.map((file) => {
    return RegisterFile(db, file.path);
  }));

  return res.status(200).json(newFiles);
}
