import { Router } from 'express';
import { getAllStops } from '../controllers/stops.js';

const stopsRouter = Router();

stopsRouter.get('/', getAllStops);

export default stopsRouter;