import { NextFunction, Request, Response } from 'express';
import { db } from '../db.js';
import { Feature, FeatureCollection, LineString, Point } from 'geojson';
import { GetTripInfoPayload, Shape, StopTime, Trip } from '../types/index.js';
import _ from 'lodash';

export const getTripsFromStops = async (req: Request, res: Response, next: NextFunction) => {
    const { serviceId, startStopId, endStopId } = req.params;
    const trips = await db.getTripsByStops(serviceId, startStopId, endStopId);
    res.json({ tripsWithTimesMap: _.keyBy(trips, 'id') });
}

export const getTripInfo = async (req: Request, res: Response, next: NextFunction) => {
    const { start, end } = req.query;
    const { tripId } = req.params;
    const trip = await db.getTrip(tripId);
    const tripTransferInfo = await db.getTripTransfer(tripId);
    const transferTrip = tripTransferInfo && await db.getTrip(tripTransferInfo.to_trip_id);
    if (!trip) return res.status(404).end();

    const startStopSeq = typeof start === 'string' ? parseInt(start) : NaN;
    const endStopSeq = typeof end === 'string' ? parseInt(end) : NaN;
    const stopTimes = await db.getTripStopTimes(tripId, isNaN(startStopSeq) ? undefined : startStopSeq, isNaN(endStopSeq) ? undefined : endStopSeq);
    const startShapeDist = stopTimes[0].distanceTraveled;
    const endShapeDist = stopTimes[stopTimes.length - 1].distanceTraveled;
    const shapes: Shape[][] = [];
    await db.getTripShapes(tripId, startShapeDist, tripTransferInfo ? undefined : endShapeDist)
        .then(tripShapes => shapes.push(tripShapes));
    
    if (tripTransferInfo)
        await db.getTripShapes(tripTransferInfo.to_trip_id, 0, endShapeDist)
            .then(tripShapes => shapes.push(tripShapes));
    
    const geojsonStops: GetTripInfoPayload['geojsonStops'] = {
        type: 'FeatureCollection',
        features: stopTimes.map((stopTime): Feature<Point, StopTime> => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [stopTime.lon, stopTime.lat]
            },
            properties: stopTime,
            id: stopTime.id
        }))
    }

    const geojsonLines: GetTripInfoPayload['geojsonLines'] = {
        type: 'FeatureCollection',
        features: [
            ...shapes.map((shape, i): Feature<LineString, Trip> => {
                const shapeTrip = i ? transferTrip! : trip;
                return {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: shape.map(({ lon, lat }) => [lon, lat])
                    },
                    properties: {
                        ...shapeTrip,
                        routeColor: '#' + shapeTrip.routeColor
                    },
                    id: shapeTrip.id
                }
            })
        ]
    }

    if (tripTransferInfo) {
        const { lon, lat } = shapes[0][shapes[0].length - 1];
        geojsonLines.features.push({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [lon, lat],
                    [shapes[1][0].lon, shapes[1][0].lat]
                ]
            },
            properties: null,
            id: trip.id.slice(0, trip.id.lastIndexOf('_')) + '_transfer'
        })
    }

    res.json({ stopTimesMap: _.keyBy(stopTimes, 'id'), geojsonStops, geojsonLines });
}

export const getTrip = async (req: Request, res: Response, next: NextFunction) => {
    const trip = await db.getTrip(req.params.tripId);
    res.json(trip);
}