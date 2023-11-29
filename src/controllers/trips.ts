import { NextFunction, Request, Response } from 'express';
import { db } from '../db.js';
import { Feature, FeatureCollection, LineString, Point } from 'geojson';
import { GetTripInfoPayload, StopTime } from '../types/index.js';
import _ from 'lodash';

export const getTripsFromStops = async (req: Request, res: Response, next: NextFunction) => {
    const { serviceId, startStopId, endStopId } = req.params;
    const trips = await db.getTripsByStops(serviceId, startStopId, endStopId);
    res.json({ tripsWithTimesMap: _.keyBy(trips, 'id') });
}

export const getTripInfo = async (req: Request, res: Response, next: NextFunction) => {
    const { start, end } = req.query;
    const { tripId } = req.params;
    const startStopSeq = typeof start === 'string' ? parseInt(start) : NaN;
    const endStopSeq = typeof end === 'string' ? parseInt(end) : NaN;
    const stopTimes = await db.getTripStopTimes(tripId, isNaN(startStopSeq) ? undefined : startStopSeq, isNaN(endStopSeq) ? undefined : endStopSeq);
    const startShapeDist = stopTimes[0].distanceTraveled;
    const endShapeDist = stopTimes[stopTimes.length - 1].distanceTraveled;
    const shapes = await db.getTripShapes(tripId, startShapeDist, endShapeDist);
    const trip = await db.getTrip(tripId);
    const geojson: GetTripInfoPayload['geojson'] = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: shapes.map(({ lon, lat }) => [lon, lat]),
                },
                properties: trip,
                id: tripId
            },
            ...stopTimes.map((stopTime): Feature<Point, StopTime> => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [stopTime.lon, stopTime.lat]
                },
                properties: stopTime,
                id: stopTime.id
            }))
        ]
    }
    res.json({ stopTimesMap: _.keyBy(stopTimes, 'id'), geojson });
}