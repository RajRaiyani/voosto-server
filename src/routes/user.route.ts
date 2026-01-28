import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import withDatabase from '@/utils/withDatabase.js';

import { ValidationSchema as RegisterNewUserValidationSchema, Controller as RegisterNewUserController } from '@/components/user/registerNewUser.js';
import { ValidationSchema as VerifyRegistrationValidationSchema, Controller as VerifyRegistrationController } from '@/components/user/verifyRegistration.js';
import { ValidationSchema as LoginUserValidationSchema, Controller as LoginUserController } from '@/components/user/loginUser.js';
import { ValidationSchema as ForgotPasswordValidationSchema, Controller as ForgotPasswordController } from '@/components/user/forgotPassword.js';
import { ValidationSchema as ResetPasswordValidationSchema, Controller as ResetPasswordController } from '@/components/user/resetPassword.js';
import { ValidationSchema as ForgotPasswordOtpValidationSchema, Controller as ForgotPasswordOtpController } from '@/components/user/forgotPasswordOtp.js';
import { ValidationSchema as VerifyForgotPasswordOtpValidationSchema, Controller as VerifyForgotPasswordOtpController } from '@/components/user/verifyForgotPasswordOtp.js';

const router = express.Router();

router.post('/register', validate(RegisterNewUserValidationSchema), withDatabase(RegisterNewUserController));
router.post('/verify-registration', validate(VerifyRegistrationValidationSchema), withDatabase(VerifyRegistrationController));
router.post('/login', validate(LoginUserValidationSchema), withDatabase(LoginUserController));
router.post('/forgot-password', validate(ForgotPasswordValidationSchema), withDatabase(ForgotPasswordController));
router.post('/reset-password', validate(ResetPasswordValidationSchema), withDatabase(ResetPasswordController));
router.post('/forgot-password-otp', validate(ForgotPasswordOtpValidationSchema), withDatabase(ForgotPasswordOtpController));
router.post('/verify-forgot-password-otp', validate(VerifyForgotPasswordOtpValidationSchema), withDatabase(VerifyForgotPasswordOtpController));
export default router;
