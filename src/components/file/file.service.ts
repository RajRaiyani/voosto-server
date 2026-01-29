import { DatabaseClient } from '@/service/database/index.js';

export async function CreateNewFile(db: DatabaseClient, { key, size, _status = 'pending' }: {key:string, size?: number| null, _status?: string}) {
  const file = await db.queryOne('INSERT INTO files (key, size, _status) VALUES ($1, $2, $3) RETURNING *', [key, size, _status]);
  return file;
}
