import RegisterService, { type Context } from '@/core/registerService.js';
import ServerError from '@/core/ServerError.class.js';
import { upload, deleteFile as deleteFileFromStorage } from '@/service/file-storage/index.js';
import Event from '@/service/event/index.js';
import env from '@/config/env.js';



async function registerNewFileService(
  { database:db }: Context,
  { filePath, _status = 'pending' }: {filePath:string, _status?: string},
) {
  const key = await upload(filePath);
  const file = await db.queryOne(
    'INSERT INTO files (key, _status, endpoint) VALUES ($1, $2, $3) RETURNING *',
    [key, _status, env.fileStorageEndpoint]
  );
  Event.emit('file:registered', file);
  return file;
}

async function hardDeleteFileService({ database:db }: Context, { id }: { id: string }) {
  const file = await db.queryOne('SELECT id, key FROM files WHERE id = $1', [id]);
  if (!file) return;
  await db.query('DELETE FROM files WHERE id = $1', [id]);
  await deleteFileFromStorage(file.key);
}



async function updateFileStatusService({ database:db }: Context, { id, status }: { id: string, status: string }) {
  const file = await db.queryOne('SELECT id, key, url, _status FROM files WHERE id = $1', [id]);
  if (!file) throw new ServerError('NOT_FOUND', 'File not found');
  if (file._status === status) return file;
  await db.query('UPDATE files SET _status = $1 WHERE id = $2', [status, id]);
  return file;
}


async function saveFileService(ctx: Context, { id }: { id: string }) {
  const file = await updateFileStatus(ctx, { id, status: 'saved' });
  Event.emit('file:saved', file);
  return file;
}


async function deleteFileService(ctx: Context, { id }: { id: string }) {
  return await updateFileStatus(ctx, { id, status: 'deleted' });
}


export const registerNewFile = RegisterService(registerNewFileService);
export const hardDeleteFile = RegisterService(hardDeleteFileService);
export const updateFileStatus = RegisterService(updateFileStatusService);
export const saveFile = RegisterService(saveFileService);
export const deleteFile = RegisterService(deleteFileService);