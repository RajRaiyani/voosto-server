import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';
import env from '@/config/env.js';
import ServerError from '@/utils/serverError.js';
import sharp from 'sharp';

const fileStoragePath = env.fileStoragePath;

if (!fs.existsSync(fileStoragePath)) fs.mkdirSync(fileStoragePath, { recursive: true });

export const upload = async (filePath: string, newFileKey: string = '') => {
  const isFileExists = fs.existsSync(filePath);
  if (!isFileExists) throw new ServerError('NOT_FOUND', 'File not found');
  const fileKey = path.join(newFileKey, path.basename(filePath));
  if (!fs.existsSync(path.join(env.fileStoragePath, newFileKey))) fs.mkdirSync(path.join(env.fileStoragePath, newFileKey), { recursive: true });
  await fsp.copyFile(filePath, path.join(env.fileStoragePath, fileKey));
  await fsp.unlink(filePath);
  return fileKey;
};


export const deleteFile = async (fileKey: string) => {
  const filePath = path.join(env.fileStoragePath, fileKey);
  if (!fs.existsSync(filePath)) return;
  await fsp.unlink(filePath);
};


export async function convertToWebp(fileKey: string) {
  if (fileKey.endsWith('.webp')) return fileKey;
  const filePath = path.join(env.fileStoragePath, fileKey);
  const outputFileKey = path.basename(fileKey, path.extname(fileKey)) + '.webp';
  const outputFilePath = path.join(env.fileStoragePath, outputFileKey);
  if (!fs.existsSync(filePath)) throw new ServerError('NOT_FOUND', 'File not found');
  await sharp(filePath).webp({ quality: 100 }).toFile(outputFilePath);
  return outputFileKey;
}


/**
 * Get all file keys from the file storage
 * @param dir - The directory to search for files
 * @param files - The array to store the file keys
 * @returns The array of file keys
 */
export async function getAllFileKeys(dir: string = env.fileStoragePath, files = []){

  const entries = await fsp.readdir(dir, { recursive: true, withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile()) {
      files.push(path.join(dir, entry.name).replace(env.fileStoragePath + '/', ''));
    }

    if (entry.isDirectory()) {
      await getAllFileKeys(path.join(env.fileStoragePath, entry.name), files);
    }
  }

  return files;
}
