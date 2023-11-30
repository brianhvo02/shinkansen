import { Feature, FeatureCollection, LineString, Point } from 'geojson';

export interface Stop {
    id: string;
    name: string;
    lat: number;
    lon: number;
    nameEn: string;
}

export interface GetStopsPayload {
    stopsMap: Record<string, Stop>;
    geojson: FeatureCollection<Point, Stop>;
}

export interface Trip {
    id: string;
    routeId: string;
    service: string;
    headsign: string;
    shortName: string;
    direction: string;
}

export interface TripWithTimes extends Trip {
    arrivalTimes: string;
    arrivalTimestamps: string;
    departureTimes: string;
    departureTimestamps: string;
    stopSequences: string;
    headsignEn: string;
    shortNameEn: string;
}

export interface GetTripsByStopsPayload {
    tripsWithTimesMap: Record<string, TripWithTimes>;
}

export interface StopTime {
    arrivalTime: string; 
    arrivalTimestamp: number;
    departureTime: string;
    departureTimestamp: number;
    seq: number;
    distanceTraveled: number;
    id: string;
    name: string;
    lat: number;
    lon: number;
    nameEn: string;
}

export interface Shape {
    lat: number;
    lon: number;
    seq: number;
}

export interface GetTripInfoPayload {
    stopTimesMap: Record<string, StopTime>;
    geojsonStops: FeatureCollection<Point, StopTime>;
    geojsonLine: Feature<LineString, Trip>;
}

interface TranslationsMap {
    [table_name: string]: {
        [field_name: string]: {
            [record_id: string]: {
                [language: string]: string;
            }
        }
    }
}