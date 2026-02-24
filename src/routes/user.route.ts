import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import withDatabase from '@/utils/withDatabase.js';
import isUserLoggedIn from '@/middleware/auth/isUserLoggedIn.js';

import { ValidationSchema as RegisterNewUserValidationSchema, Controller as RegisterNewUserController } from '@/components/user/controllers/registerNewUser.js';
import { ValidationSchema as VerifyRegistrationValidationSchema, Controller as VerifyRegistrationController } from '@/components/user/controllers/verifyRegistration.js';
import { ValidationSchema as LoginUserValidationSchema, Controller as LoginUserController } from '@/components/user/controllers/loginUser.js';
import { ValidationSchema as ForgotPasswordValidationSchema, Controller as ForgotPasswordController } from '@/components/user/controllers/forgotPassword.js';
import { ValidationSchema as ResetPasswordValidationSchema, Controller as ResetPasswordController } from '@/components/user/controllers/resetPassword.js';
import { ValidationSchema as ForgotPasswordOtpValidationSchema, Controller as ForgotPasswordOtpController } from '@/components/user/controllers/forgotPasswordOtp.js';
import { ValidationSchema as VerifyForgotPasswordOtpValidationSchema, Controller as VerifyForgotPasswordOtpController } from '@/components/user/controllers/verifyForgotPasswordOtp.js';
import { Controller as GetProfileController } from '@/components/user/controllers/getProfile.js';
import { ValidationSchema as CompleteUserProfileValidationSchema, Controller as CompleteUserProfileController } from '@/components/user/controllers/completeUserProfile.js';
import { ValidationSchema as UpdateProfileValidationSchema, Controller as UpdateProfileController } from '@/components/user/controllers/updateProfile.js';
import { ValidationSchema as SendFriendRequestValidationSchema, Controller as SendFriendRequestController } from '@/components/user/controllers/sendFriendRequest.js';
import { ValidationSchema as AcceptFriendRequestValidationSchema, Controller as AcceptFriendRequestController } from '@/components/user/controllers/acceptFriendRequest.js';
import { Controller as ListIncomingRequestsController } from '@/components/user/controllers/listFriendRequests.js';
import { Controller as ListFriendsController } from '@/components/user/controllers/listFriends.js';
import { ValidationSchema as UpdateUserLocationValidationSchema, Controller as UpdateUserLocationController } from '@/components/user/controllers/updateUserLocation.js';
import { ValidationSchema as GetUserProfileValidationSchema, Controller as GetUserProfileController } from '@/components/user/controllers/getUserProfile.js';
import { ValidationSchema as UnFriendUserValidationSchema, Controller as UnFriendUserController } from '@/components/user/controllers/unFriendUser.js';
import { ValidationSchema as ListUsersValidationSchema, Controller as ListUsersController } from '@/components/user/controllers/listUsers.js';
import { ValidationSchema as AddVisitedCountryValidationSchema, Controller as AddVisitedCountryController } from '@/components/user/controllers/addVisitedCountry.js';
import { ValidationSchema as DeleteVisitedCountryValidationSchema, Controller as DeleteVisitedCountryController } from '@/components/user/controllers/deleteVisitedCountry.js';
import { ValidationSchema as LoginWithGoogleValidationSchema, Controller as LoginWithGoogleController } from '@/components/user/controllers/loginWithGoogle.js';
import { ValidationSchema as UpsertUserNotificationTokenValidationSchema, Controller as UpsertUserNotificationTokenController } from '@/components/user/controllers/upsertUserNotificationToken.js';
import { ValidationSchema as UpdateUserSettingValidationSchema, Controller as UpdateUserSettingController } from '@/components/user/controllers/updateUserSetting.js';

const router = express.Router();

router.route('/')
  .get(isUserLoggedIn, validate(ListUsersValidationSchema), withDatabase(ListUsersController));

router.route('/register')
  .post(validate(RegisterNewUserValidationSchema), withDatabase(RegisterNewUserController));
  
router.route('/verify-registration')
  .post(validate(VerifyRegistrationValidationSchema), withDatabase(VerifyRegistrationController));

router.route('/login')
  .post(validate(LoginUserValidationSchema), withDatabase(LoginUserController));

router.route('/login-with-google')
  .post(validate(LoginWithGoogleValidationSchema), withDatabase(LoginWithGoogleController));

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

router.route('/notification-tokens')
  .post(isUserLoggedIn, validate(UpsertUserNotificationTokenValidationSchema), withDatabase(UpsertUserNotificationTokenController));

router.route('/settings')
  .put(isUserLoggedIn, validate(UpdateUserSettingValidationSchema), withDatabase(UpdateUserSettingController));

router.route('/visited-countries/:country_id')
  .post(isUserLoggedIn, validate(AddVisitedCountryValidationSchema), withDatabase(AddVisitedCountryController))
  .delete(isUserLoggedIn, validate(DeleteVisitedCountryValidationSchema), withDatabase(DeleteVisitedCountryController));

router.route('/:user_id')
  .get(isUserLoggedIn, validate(GetUserProfileValidationSchema), withDatabase(GetUserProfileController));

router.route('/:user_id/unfriend')
  .delete(isUserLoggedIn, validate(UnFriendUserValidationSchema), withDatabase(UnFriendUserController));


export default router;
