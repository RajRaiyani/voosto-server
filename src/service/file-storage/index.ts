import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';
import env from '@/config/env.js';
import ServerError from '@/utils/serverError.js';
import constant from '@/config/constant.js';

export const upload = async (filePath: string, newFilePath: string = '') => {
  const isFileExists = fs.existsSync(filePath);
  if (!isFileExists) throw new ServerError('NOT_FOUND', 'File not found');
  const fileKey = path.join(newFilePath, path.basename(filePath));
  if (!fs.existsSync(path.join(env.fileStoragePath, newFilePath))) fs.mkdirSync(path.join(env.fileStoragePath, newFilePath), { recursive: true });
  await fsp.copyFile(filePath, path.join(env.fileStoragePath, fileKey));
  await fsp.unlink(filePath);
  return fileKey;
};

export const saveFile = async (fileName: string) => {
  const existingFilePath = path.join(constant.temporaryFileStoragePath, fileName);
  await upload(existingFilePath);
  return fileName;
};

export const deleteFile = async (filename: string) => {
  await fsp.unlink(path.join(env.fileStoragePath, filename));
};

export const replaceOldFile = async (oldFileName: string, newFileName: string) => {
  if (!newFileName) return newFileName;
  if (oldFileName === newFileName) return newFileName;
  await saveFile(newFileName);
  return newFileName;
};
