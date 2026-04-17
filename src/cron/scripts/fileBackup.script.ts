import fs from 'fs';
import archiver from 'archiver';
import path from 'path';
import { fileURLToPath } from 'url';
import { s3 } from '@/service/aws/index.js';
import {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import Constants from '@/config/constant.js';
import env from '@/config/env.js';

/* ---------------- CONFIG ---------------- */

const SOURCE_DIR = env.fileStoragePath;
const RETENTION_COUNT = 10;
const BACKUP_BUCKET = env.aws.s3BackupBucket;
const s3BackupKey = 'voosto/file_backups';



const IST = 'Asia/Kolkata';

function formatTimestamp(d = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const y = get('year');
  const m = get('month');
  const day = get('day');
  const h = get('hour');
  const min = get('minute');
  const s = get('second');
  return `${y}-${m}-${day}_${h}-${min}-${s}`;
}


/* ---------------- HELPERS ---------------- */

async function zipFolder(source: string, out: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(out);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(source, false);
    archive.finalize();

    output.on('close', resolve);
    archive.on('error', reject);
  });
}

async function uploadToS3(filePath: string, key: string) {
  const stream = fs.createReadStream(filePath);

  await s3.send(
    new PutObjectCommand({
      Bucket: BACKUP_BUCKET,
      Key: key,
      Body: stream,
    })
  );
}

async function applyRetention(prefix: string) {
  const res = await s3.send(
    new ListObjectsV2Command({
      Bucket: BACKUP_BUCKET,
      Prefix: prefix,
    })
  );

  const files = (res.Contents || []).sort(
    (a, b) =>
      new Date(a.LastModified!).getTime() -
      new Date(b.LastModified!).getTime()
  );

  if (files.length <= RETENTION_COUNT) return;

  const oldFiles = files.slice(0, files.length - RETENTION_COUNT);

  for (const f of oldFiles) {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BACKUP_BUCKET,
        Key: f.Key!,
      })
    );
  }

}

/* ---------------- MAIN TASK ---------------- */

export async function task() {

  const date = formatTimestamp();
  const { database } = env.database;
  const folder = path.join(s3BackupKey, database, 'file');

  // Local temp zip file
  const zipPath = path.join(Constants.temporaryFileStoragePath, `${date}.zip`);

  // Final S3 object key
  const key = path.join(folder, `${date}.zip`);

  await zipFolder(SOURCE_DIR, zipPath);

  await uploadToS3(zipPath, key);

  fs.unlinkSync(zipPath);

  await applyRetention(folder);

}

/* ---------------- AUTO RUN ---------------- */

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  task().catch(console.error);
}

