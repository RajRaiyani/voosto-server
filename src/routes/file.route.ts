import express from 'express';
import WithDatabase from '@/utils/withDatabase.js';
import isUserLoggedIn from '@/middleware/auth/isUserLoggedIn.js';
import fileUpload from '@/middleware/multer/fileUpload.js';
import { Controller as uploadFileController } from '@/components/file/uploadFile.js';
import { Controller as uploadMultipleFilesController } from '@/components/file/uploadMultipleFiles.js';


const router = express.Router();

router.route('/upload').post(isUserLoggedIn, fileUpload.single('file'), WithDatabase(uploadFileController));
router.route('/upload-multiple').post(isUserLoggedIn, fileUpload.array('files', 10), WithDatabase(uploadMultipleFilesController));

export default router;
