import express from 'express';
import { validate } from '@/utils/validationHelper.js';
import withDatabase from '@/utils/withDatabase.js';
import isUserLoggedIn from '@/middleware/auth/isUserLoggedIn.js';

import { ValidationSchema as RegisterNewUserValidationSchema, Controller as RegisterNewUserController } from '@/modules/user/controllers/auth/registerNewUser.js';
import { ValidationSchema as VerifyRegistrationValidationSchema, Controller as VerifyRegistrationController } from '@/modules/user/controllers/auth/verifyRegistration.js';
import { ValidationSchema as LoginUserValidationSchema, Controller as LoginUserController } from '@/modules/user/controllers/auth/loginUser.js';
import { ValidationSchema as ForgotPasswordValidationSchema, Controller as ForgotPasswordController } from '@/modules/user/controllers/auth/forgotPassword.js';
import { ValidationSchema as ResetPasswordValidationSchema, Controller as ResetPasswordController } from '@/modules/user/controllers/auth/resetPassword.js';
import { ValidationSchema as ForgotPasswordOtpValidationSchema, Controller as ForgotPasswordOtpController } from '@/modules/user/controllers/auth/forgotPasswordOtp.js';
import { ValidationSchema as VerifyForgotPasswordOtpValidationSchema, Controller as VerifyForgotPasswordOtpController } from '@/modules/user/controllers/auth/verifyForgotPasswordOtp.js';
import { Controller as GetProfileController } from '@/modules/user/controllers/getProfile.js';
import { ValidationSchema as CompleteUserProfileValidationSchema, Controller as CompleteUserProfileController } from '@/modules/user/controllers/completeUserProfile.js';
import { ValidationSchema as UpdateProfileValidationSchema, Controller as UpdateProfileController } from '@/modules/user/controllers/updateProfile.js';
import { ValidationSchema as SendFriendRequestValidationSchema, Controller as SendFriendRequestController } from '@/modules/user/controllers/sendFriendRequest.js';
import { ValidationSchema as AcceptFriendRequestValidationSchema, Controller as AcceptFriendRequestController } from '@/modules/user/controllers/acceptFriendRequest.js';
import { Controller as ListIncomingRequestsController } from '@/modules/user/controllers/listFriendRequests.js';
import { ValidationSchema as ListFriendsValidationSchema, Controller as ListFriendsController } from '@/modules/user/controllers/listFriends.js';
import { ValidationSchema as UpdateUserLocationValidationSchema, Controller as UpdateUserLocationController } from '@/modules/user/controllers/updateUserLocation.js';
import { ValidationSchema as GetUserProfileValidationSchema, Controller as GetUserProfileController } from '@/modules/user/controllers/getUserProfile.js';
import { ValidationSchema as UnFriendUserValidationSchema, Controller as UnFriendUserController } from '@/modules/user/controllers/unFriendUser.js';
import { ValidationSchema as ListUsersValidationSchema, Controller as ListUsersController } from '@/modules/user/controllers/listUsers.js';
import { ValidationSchema as AddVisitedCountryValidationSchema, Controller as AddVisitedCountryController } from '@/modules/user/controllers/addVisitedCountry.js';
import { ValidationSchema as DeleteVisitedCountryValidationSchema, Controller as DeleteVisitedCountryController } from '@/modules/user/controllers/deleteVisitedCountry.js';
import { ValidationSchema as LoginWithGoogleValidationSchema, Controller as LoginWithGoogleController } from '@/modules/user/controllers/auth/loginWithGoogle.js';
import { ValidationSchema as UpsertUserNotificationTokenValidationSchema, Controller as UpsertUserNotificationTokenController } from '@/modules/user/controllers/upsertUserNotificationToken.js';
import { ValidationSchema as UpdateUserSettingValidationSchema, Controller as UpdateUserSettingController } from '@/modules/user/controllers/updateUserSetting.js';
import { Controller as DeleteAccountController } from '@/modules/user/controllers/deleteAccount.js';
import { ValidationSchema as ReportUserValidationSchema, Controller as ReportUserController } from '@/modules/user/controllers/reportUser.js';
import { ValidationSchema as BlockUserValidationSchema, Controller as BlockUserController } from '@/modules/user/controllers/blockUser.js';
import { ValidationSchema as UnblockUserValidationSchema, Controller as UnblockUserController } from '@/modules/user/controllers/unblockUser.js';
import { ValidationSchema as ListBlockedUsersValidationSchema, Controller as ListBlockedUsersController } from '@/modules/user/controllers/listBlockedUsers.js';

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
  

router.route('/blocked-users')
  .get(isUserLoggedIn, validate(ListBlockedUsersValidationSchema), withDatabase(ListBlockedUsersController));
  
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

router.route('/delete-account')
  .delete(isUserLoggedIn, withDatabase(DeleteAccountController));

router.route('/visited-countries/:country_id')
  .post(isUserLoggedIn, validate(AddVisitedCountryValidationSchema), withDatabase(AddVisitedCountryController))
  .delete(isUserLoggedIn, validate(DeleteVisitedCountryValidationSchema), withDatabase(DeleteVisitedCountryController));

router.route('/:user_id')
  .get(isUserLoggedIn, validate(GetUserProfileValidationSchema), withDatabase(GetUserProfileController));

router.route('/:user_id/friends')
  .get(isUserLoggedIn, validate(ListFriendsValidationSchema), withDatabase(ListFriendsController));

router.route('/:user_id/unfriend')
  .delete(isUserLoggedIn, validate(UnFriendUserValidationSchema), withDatabase(UnFriendUserController));

router.route('/:user_id/block')
  .post(isUserLoggedIn, validate(BlockUserValidationSchema), withDatabase(BlockUserController))
  .delete(isUserLoggedIn, validate(UnblockUserValidationSchema), withDatabase(UnblockUserController));

router.route('/:user_id/report')
  .post(isUserLoggedIn, validate(ReportUserValidationSchema), withDatabase(ReportUserController));


export default router;
