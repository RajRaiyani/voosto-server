import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { registerNewFile } from '@/modules/file/file.service.js';


export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'Files are required' });
  }

  const newFiles = await Promise.all(files.map((file) => {
    return registerNewFile({ database:db }, { filePath: file.path });
  }));

  return res.status(200).json(newFiles);
}
