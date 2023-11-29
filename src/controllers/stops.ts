import { NextFunction, Request, Response } from 'express';
import { db } from '../db.js';
import { FeatureCollection, Point } from 'geojson';
import { GetStopsPayload, Stop } from '../types/index.js';
import _ from 'lodash';

export const getAllStops = async (req: Request, res: Response, next: NextFunction) => {
    const stops = await db.getStops();
    const geojson: GetStopsPayload['geojson'] = {
        type: 'FeatureCollection',
        features: stops.map(stop => {
            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [stop.lon, stop.lat]
                },
                properties: stop,
                id: stop.id
            }
        })
    }
    res.json({
        stopsMap: _.keyBy(stops, 'id'), 
        geojson 
    });
}