import { NextFunction, Request, Response } from 'express';
import { upload } from '@/service/file-storage/index.js';
import { DatabaseClient } from '@/service/database/index.js';
import { CreateNewFile } from '@/components/file/file.service.js';


export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'File is required' });
  }

  const newFileName = await upload(file.path);
  const newFile = await CreateNewFile(db, { key: newFileName, size: file.size, mimetype: file.mimetype });

  return res.status(200).json(newFile);
}
