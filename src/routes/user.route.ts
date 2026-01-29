import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import withDatabase from '@/utils/withDatabase.js';
import isUserLoggedIn from '@/middleware/auth/isUserLoggedIn.js';

import { ValidationSchema as RegisterNewUserValidationSchema, Controller as RegisterNewUserController } from '@/components/user/registerNewUser.js';
import { ValidationSchema as VerifyRegistrationValidationSchema, Controller as VerifyRegistrationController } from '@/components/user/verifyRegistration.js';
import { ValidationSchema as LoginUserValidationSchema, Controller as LoginUserController } from '@/components/user/loginUser.js';
import { ValidationSchema as ForgotPasswordValidationSchema, Controller as ForgotPasswordController } from '@/components/user/forgotPassword.js';
import { ValidationSchema as ResetPasswordValidationSchema, Controller as ResetPasswordController } from '@/components/user/resetPassword.js';
import { ValidationSchema as ForgotPasswordOtpValidationSchema, Controller as ForgotPasswordOtpController } from '@/components/user/forgotPasswordOtp.js';
import { ValidationSchema as VerifyForgotPasswordOtpValidationSchema, Controller as VerifyForgotPasswordOtpController } from '@/components/user/verifyForgotPasswordOtp.js';
import { Controller as GetUserProfileController } from '@/components/user/getUserProfile.js';
import { ValidationSchema as CompleteUserProfileValidationSchema, Controller as CompleteUserProfileController } from '@/components/user/completeUserProfile.js';

  
const router = express.Router();

router.route('/register')
  .post(validate(RegisterNewUserValidationSchema), withDatabase(RegisterNewUserController));
  
router.route('/verify-registration')
  .post(validate(VerifyRegistrationValidationSchema), withDatabase(VerifyRegistrationController));

router.route('/login')
  .post(validate(LoginUserValidationSchema), withDatabase(LoginUserController));

router.route('/forgot-password')
  .post(validate(ForgotPasswordValidationSchema), withDatabase(ForgotPasswordController));
  
router.route('/reset-password')
  .post(validate(ResetPasswordValidationSchema), withDatabase(ResetPasswordController));

router.route('/forgot-password-otp')
  .post(validate(ForgotPasswordOtpValidationSchema), withDatabase(ForgotPasswordOtpController));

router.route('/verify-forgot-password-otp')
  .post(validate(VerifyForgotPasswordOtpValidationSchema), withDatabase(VerifyForgotPasswordOtpController));

router.route('/profile')
  .get(isUserLoggedIn, withDatabase(GetUserProfileController));

router.route('/complete-profile')
  .put(isUserLoggedIn, validate(CompleteUserProfileValidationSchema), withDatabase(CompleteUserProfileController));

export default router;
