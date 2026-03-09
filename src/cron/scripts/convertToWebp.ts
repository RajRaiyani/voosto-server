import Database from '@/service/database/index.js';
import { convertImageToWebp } from '@/modules/file/file.service.js';
import Logger from '@/service/logger/index.js';

export async function task() {

  const db = await Database.getConnection();

  try {
    const filesToConvert = await db.queryAll(`
      SELECT id, key FROM files WHERE _status = $1 AND key NOT LIKE '%.webp' AND ( key LIKE '%.png' OR key LIKE '%.jpg' OR key LIKE '%.jpeg')
    `, ['saved']);

    console.log(filesToConvert);

    for (const file of filesToConvert) {
      await convertImageToWebp({ database: db }, { id: file.id });
      Logger.info(`Converted file: ${file.key}`);
    }

  } finally {
    db.release();
  }

  return Logger.info('Process completed');
}


task();
