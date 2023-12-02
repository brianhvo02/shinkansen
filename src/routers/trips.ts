import { Router } from 'express';
import { getTrip, getTripInfo, getTripsFromStops } from '../controllers/trips.js';

const tripsRouter = Router();

tripsRouter.get('/:tripId', getTrip);
tripsRouter.get('/info/:tripId', getTripInfo);
tripsRouter.get('/:serviceId/:startStopId/:endStopId', getTripsFromStops);

export default tripsRouter;