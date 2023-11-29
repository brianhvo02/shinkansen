import { Router } from 'express';
import stopsRouter from './stops.js';
import tripsRouter from './trips.js';

const appRouter = Router();

appRouter.use('/stops', stopsRouter);
appRouter.use('/trips', tripsRouter);

export default appRouter;