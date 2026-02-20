import Database from '@/service/database/index.js';
import { HardDeleteFile } from '@/components/file/file.service.js';
import Logger from '@/service/logger/index.js';



export async function task() {
  const db = await Database.getConnection();

  try {

    const filesToDelete = await db.queryAll(`
      SELECT id, key, _status FROM files WHERE _status in ('pending', 'deleted') AND created_at < NOW() - INTERVAL '1 minute'
    `);

    for (const file of filesToDelete) {
      await HardDeleteFile(db, file.id);
      Logger.info(`Deleted file: ${file.key}`);
    }

  } finally{
    db.release();
  }

  Logger.info('Process completed');
}

