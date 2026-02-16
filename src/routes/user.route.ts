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
import { Controller as GetProfileController } from '@/components/user/getProfile.js';
import { ValidationSchema as CompleteUserProfileValidationSchema, Controller as CompleteUserProfileController } from '@/components/user/completeUserProfile.js';
import { ValidationSchema as UpdateProfileValidationSchema, Controller as UpdateProfileController } from '@/components/user/updateProfile.js';
import { ValidationSchema as SendFriendRequestValidationSchema, Controller as SendFriendRequestController } from '@/components/user/sendFriendRequest.js';
import { ValidationSchema as AcceptFriendRequestValidationSchema, Controller as AcceptFriendRequestController } from '@/components/user/acceptFriendRequest.js';
import { Controller as ListIncomingRequestsController } from '@/components/user/listIncomingRequests.js';
import { Controller as ListFriendsController } from '@/components/user/listFriends.js';
import { ValidationSchema as UpdateUserLocationValidationSchema, Controller as UpdateUserLocationController } from '@/components/user/updateUserLocation.js';
import { ValidationSchema as GetUserProfileValidationSchema, Controller as GetUserProfileController } from '@/components/user/getUserProfile.js';
  
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
  .get(isUserLoggedIn, withDatabase(GetProfileController))
  .put(isUserLoggedIn, validate(UpdateProfileValidationSchema), withDatabase(UpdateProfileController));

router.route('/complete-profile')
  .put(isUserLoggedIn, validate(CompleteUserProfileValidationSchema), withDatabase(CompleteUserProfileController));


router.route('/friends')
  .get(isUserLoggedIn, withDatabase(ListFriendsController));
  
router.route('/friend-requests')
  .get(isUserLoggedIn, withDatabase(ListIncomingRequestsController))
  .post(isUserLoggedIn, validate(SendFriendRequestValidationSchema), withDatabase(SendFriendRequestController));

router.route('/friend-requests/accept')
  .post(isUserLoggedIn, validate(AcceptFriendRequestValidationSchema), withDatabase(AcceptFriendRequestController));

router.route('/location')
  .put(isUserLoggedIn, validate(UpdateUserLocationValidationSchema), UpdateUserLocationController);

router.route('/:user_id')
  .get(isUserLoggedIn, validate(GetUserProfileValidationSchema), withDatabase(GetUserProfileController));
  
export default router;
