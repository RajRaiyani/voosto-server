import Database from '@/service/database/index.js';
import { getAllFileKeys } from '@/service/file-storage/index.js';
import path from 'path';
import env from '@/config/env.js';
import fsp from 'fs/promises';
import Logger from '@/service/logger/index.js';


export async function task() {
  const db = await Database.getConnection();

  try {

    const dbFiles = await db.queryAll(`
      SELECT id, key, _status FROM files
    `);

    const dbFilesKeys = dbFiles.map((file) => file.key);
    const storageFiles = await getAllFileKeys();

    for (const file of storageFiles) {
      if (!dbFilesKeys.includes(file)) {
        await fsp.unlink(path.join(env.fileStoragePath, file));
        Logger.info(`Deleted file: ${file}`);
      }
    }


  } finally{
    db.release();
  }

  Logger.info('Process completed');
}

