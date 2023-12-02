import { Feature, FeatureCollection, LineString, Point } from 'geojson';
import { TransferType } from '../dictionary';

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
    service: string;
    shortName: string;
    headsign: string;
    direction: string;
    shortNameEn: string;
    headsignEn: string;

    routeId: string;
    routeName: string;
    routeColor: string;
    routeNameEn: string;
    agencyId: string;
    agencyName: string;
    agencyUrl: string;
    agencyNameEn: string;
    agencyUrlEn: string;

    connectionId?: string;
    connectionRouteId?: string;
    connectionRouteName?: string;
    connectionRouteColor?: string;
    connectionRouteNameEn?: string;
    connectionAgencyId?: string;
    connectionAgencyName?: string;
    connectionAgencyUrl?: string;
    connectionAgencyNameEn?: string;
    connectionAgencyUrlEn?: string;
}

export interface TripWithTimes extends Trip {
    departureTime: string;
    departureTimestamp: number;
    firstStopSequence: number;
    arrivalTime: string;
    arrivalTimestamp: number;
    lastStopSequence: number;
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

export interface Transfers {
    from_route_id: string;
    to_route_id: string;
    from_trip_id: string;
    to_trip_id: string;
    transfer_type: TransferType;
}

export interface GetTripInfoPayload {
    stopTimesMap: Record<string, StopTime>;
    geojsonStops: FeatureCollection<Point, StopTime>;
    geojsonLines: FeatureCollection<LineString, Trip | null>;
}