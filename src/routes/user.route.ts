import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import withDatabase from '@/utils/withDatabase.js';

import { ValidationSchema as RegisterNewUserValidationSchema, Controller as RegisterNewUserController } from '@/components/user/registerNewUser.js';
import { ValidationSchema as VerifyRegistrationValidationSchema, Controller as VerifyRegistrationController } from '@/components/user/verifyRegistration.js';
import { ValidationSchema as LoginUserValidationSchema, Controller as LoginUserController } from '@/components/user/loginUser.js';

const router = express.Router();

router.post('/register', validate(RegisterNewUserValidationSchema), withDatabase(RegisterNewUserController));
router.post('/verify-registration', validate(VerifyRegistrationValidationSchema), withDatabase(VerifyRegistrationController));
router.post('/login', validate(LoginUserValidationSchema), withDatabase(LoginUserController));

export default router;
