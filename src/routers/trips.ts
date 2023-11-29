import { Router } from 'express';
import { getTripInfo, getTripsFromStops } from '../controllers/trips.js';

const tripsRouter = Router();

tripsRouter.get('/:serviceId/:startStopId/:endStopId', getTripsFromStops);
tripsRouter.get('/info/:tripId', getTripInfo);

export default tripsRouter;