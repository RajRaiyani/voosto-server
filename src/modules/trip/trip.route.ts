import express from 'express';
import WithDatabase from '@/utils/withDatabase.js';
import isUserLoggedIn from '@/middleware/auth/isUserLoggedIn.js';
import { validate } from '@/utils/validationHelper.js';
import { ValidationSchema as ListTripsSchema, Controller as ListTripsController } from '@/modules/trip/controllers/listTrips.js';
import { ValidationSchema as CreateTripSchema, Controller as CreateTripController } from '@/modules/trip/controllers/createTrip.js';
import { ValidationSchema as GetTripSchema, Controller as GetTripController } from '@/modules/trip/controllers/getTrip.js';
import { ValidationSchema as UpdateTripSchema, Controller as UpdateTripController } from '@/modules/trip/controllers/updateTrip.js';
import { ValidationSchema as DeleteTripSchema, Controller as DeleteTripController } from '@/modules/trip/controllers/deleteTrip.js';

const router = express.Router();

router
  .route('/')
  .get(isUserLoggedIn, validate(ListTripsSchema), WithDatabase(ListTripsController))
  .post(isUserLoggedIn, validate(CreateTripSchema), WithDatabase(CreateTripController));

router
  .route('/:trip_id')
  .get(isUserLoggedIn, validate(GetTripSchema), WithDatabase(GetTripController))
  .put(isUserLoggedIn, validate(UpdateTripSchema), WithDatabase(UpdateTripController))
  .delete(isUserLoggedIn, validate(DeleteTripSchema), WithDatabase(DeleteTripController));

export default router;
