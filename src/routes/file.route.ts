import express from 'express';
import WithDatabase from '@/utils/withDatabase.js';
import isUserLoggedIn from '@/middleware/auth/isUserLoggedIn.js';
import fileUpload from '@/middleware/multer/fileUpload.js';
import { Controller as uploadFileController } from '@/components/file/uploadFile.js';


const router = express.Router();

router.route('/upload').post(isUserLoggedIn, fileUpload.single('file'), WithDatabase(uploadFileController));

export default router;
