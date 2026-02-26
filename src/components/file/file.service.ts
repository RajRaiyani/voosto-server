import { DatabaseClient } from '@/service/database/index.js';
import ServerError from '@/utils/serverError.js';
import { convertToWebp, deleteFile } from '@/service/file-storage/index.js';
import { upload } from '@/service/file-storage/index.js';
import env from '@/config/env.js';

interface CreateNewFileInput {
  key: string;
  _status?: string;
}

interface CreateNewFileOutput {
  id: string;
  key: string;
  _status: string;
}

export async function CreateNewFile(db: DatabaseClient, { key, _status = 'pending' }: CreateNewFileInput): Promise<CreateNewFileOutput> {
  const file = await db.queryOne<CreateNewFileOutput>('INSERT INTO files (key, _status, endpoint) VALUES ($1, $2, $3) RETURNING id, key, _status', [key, _status, env.fileStorageEndpoint]);
  return file;
}

export async function HardDeleteFile(db: DatabaseClient, id: string) {
  const file = await db.queryOne('SELECT id, key FROM files WHERE id = $1', [id]);
  if (!file) return;
  await db.query('DELETE FROM files WHERE id = $1', [id]);
  await deleteFile(file.key);
}

export async function ConvertFileToWebp(db: DatabaseClient, id: string) {
  const file = await db.queryOne('SELECT id, key FROM files WHERE id = $1', [id]);
  if (!file) throw new ServerError('NOT_FOUND', 'File not found');
  if (file.key.endsWith('.webp')) return file.key;
  const webpKey = await convertToWebp(file.key);
  await db.query('UPDATE files SET key = $1 WHERE id = $2', [webpKey, id]);
  await deleteFile(file.key);
  return webpKey;
}

export async function UpdateFileStatus(db: DatabaseClient, id: string, status: string) {
  const file = await db.queryOne('SELECT id, key, _status FROM files WHERE id = $1', [id]);
  if (!file) throw new ServerError('NOT_FOUND', 'File not found');
  if (file._status === status) return file;
  await db.query('UPDATE files SET _status = $1 WHERE id = $2', [status, id]);
  return file;
}

export async function SaveFile(db: DatabaseClient, id: string) {
  return await UpdateFileStatus(db, id, 'saved');
}

export async function DeleteFile(db: DatabaseClient, id: string) {
  return await UpdateFileStatus(db, id, 'deleted');
}

export async function RegisterFile(db: DatabaseClient, filePath: string, newFileKey: string = '') {
  const fileKey = await upload(filePath, newFileKey);
  const file = await CreateNewFile(db, { key: fileKey });
  return file;
}