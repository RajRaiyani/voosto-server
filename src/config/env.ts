import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({
  path: path.join(__dirname, '../../.env'),
  override: true,
});

function parseDatabaseUrl(databaseUrl?: string) {

  const url = new URL(databaseUrl);
    
  const host = url.hostname;
  const port = url.port || '5432';
  const user = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = url.pathname.slice(1); // Remove leading '/'
    
  const sslModeParam = url.searchParams.get('sslmode');
  let sslMode = false;
  if (sslModeParam) sslMode = sslModeParam === 'require' || sslModeParam === 'true' || sslModeParam === 'enable';
  else sslMode = process.env.DB_SSL_MODE === 'true';

  return {
    host: host,
    port: port,
    user: user,
    password: password,
    database: database,
    sslMode,
  };
  
}


const env = {
  env: process.env.NODE_ENV || 'dev',
  port: process.env.SERVER_PORT || 3007,
  serviceName: process.env.SERVICE_NAME || 'e-commerce',
  jwtSecret: process.env.JWT_SECRET,
  fileStorageEndpoint: process.env.FILE_STORAGE_ENDPOINT || 'http://localhost:3007/files',

  fileStoragePath: process.env.FILE_STORAGE_PATH || path.join(__dirname, '../../files'),

  database: parseDatabaseUrl(process.env.DATABASE_URL),
  
  redis: {
    url : process.env.REDIS_URL || 'redis://localhost:6379',
  },

  logger : {
    consoleLogLevel: process.env.CONSOLE_LOG_LEVEL || 'info',
    fileLogLevel: process.env.FILE_LOG_LEVEL || 'false',
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    s3Bucket: process.env.AWS_S3_BUCKET,
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
  },

  google: {
    androidClientId: process.env.GOOGLE_CLIENT_ID_ANDROID,
    webClientId: process.env.GOOGLE_CLIENT_ID_WEB,
    iosClientId: process.env.GOOGLE_CLIENT_ID_IOS,
  },

  informerEmail: process.env.INFORMER_EMAIL,
};

export default env;
