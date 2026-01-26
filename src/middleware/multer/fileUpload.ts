import multer from 'multer';
import storage from './storage.js';

const upload = multer({
  storage,
  limits: { fileSize: 10485760 }, // 10MB
});

export default upload;
