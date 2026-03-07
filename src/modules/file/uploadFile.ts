import { NextFunction, Request, Response } from 'express';
import { DatabaseClient } from '@/service/database/index.js';
import { registerNewFile } from '@/modules/file/file.service.js';


export async function Controller(req: Request, res: Response, next: NextFunction, db: DatabaseClient) {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'File is required' });
  }

  const newFile = await registerNewFile({ database:db }, { filePath: file.path });

  return res.status(200).json(newFile);
}
