import sqlite3 from 'sqlite3';
import { Shape, Stop, StopTime, Transfers, Trip, TripWithTimes } from './types';
import _ from 'lodash';

export default class TransitDatabase {
    db: sqlite3.Database;

    constructor(path: string) {
        this.db = new sqlite3.Database(path);
    }

    close = async () => new Promise<void>((resolve, reject) => 
        this.db.close(err => err ? reject(err) : resolve())
    );

    async get<T>(sql: string): Promise<T | undefined>;
    async get<T>(sql: string, params: (string | number)[]): Promise<T | undefined>;
    async get<T>(sql: string, ...params: (string | number)[]): Promise<T | undefined>;
    async get<T>(sql: string, ...params: (string | number | (string | number)[])[]) {
        return new Promise<T | undefined>((resolve, reject) => 
            this.db.get<T | undefined>(
                sql, 
                Array.isArray(params[0]) 
                    ? params[0] 
                    : params, 
                (err, row) => err 
                    ? reject(err) 
                    : resolve(row)
            )
        );
    }

    async all<T>(sql: string): Promise<T[]>;
    async all<T>(sql: string, params: (string | number)[]): Promise<T[]>;
    async all<T>(sql: string, ...params: (string | number)[]): Promise<T[]>;
    async all<T>(sql: string, ...params: (string | number | (string | number)[])[]) {
        return new Promise<T[]>((resolve, reject) => 
            this.db.all<T>(
                sql, 
                Array.isArray(params[0]) 
                    ? params[0] 
                    : params, 
                (err, rows) => err 
                    ? reject(err) 
                    : resolve(rows)
            )
        );
    }

    getStops = async () => this.all<Stop>(`
        SELECT 
            stop_id AS id, 
            stop_name AS name, 
            stop_lat AS lat, 
            stop_lon AS lon, 
            translation AS nameEn
        FROM stops
        JOIN translations ON stops.stop_id = translations.record_id
        WHERE stop_id IN (
            SELECT DISTINCT stop_id
            FROM stop_times
        )
        ORDER BY nameEn
    `);

    getTripsByStops = async (serviceId: string, startStopId: string, endStopId: string) =>
        this.all<TripWithTimes>(`
            SELECT 
                trips.trip_id AS id, 
                trips.service_id AS service, 
                trips.trip_headsign AS headsign, 
                trips.trip_short_name AS shortName, 
                trips.direction_id AS direction,
                trip_short_name_translations.translation AS shortNameEn,
                trip_headsign_translations.translation AS headsignEn,
                routes.route_id AS routeId, 
                routes.route_short_name AS routeName,
                routes.route_color AS routeColor,
                route_translations.translation AS routeNameEn,
                agency.agency_id AS agencyId,
                agency.agency_name AS agencyName,
                agency.agency_url AS agencyUrl,
                agency_name_translations.translation AS agencyNameEn,
                agency_url_translations.translation AS agencyUrlEn,
                to_trips.trip_id AS connectionId, 
                to_routes.route_id AS connectionRouteId, 
                to_routes.route_short_name AS connectionRouteName,
                to_routes.route_color AS connectionRouteColor,
                to_route_translations.translation AS connectionRouteNameEn,
                to_agency.agency_id AS connectionAgencyId,
                to_agency.agency_name AS connectionAgencyName,
                to_agency.agency_url AS connectionAgencyUrl,
                to_agency_name_translations.translation AS connectionAgencyNameEn,
                to_agency_url_translations.translation AS connectionAgencyUrlEn,
                first_leg_stop_times_a.departure_time AS departureTime,
                first_leg_stop_times_a.departure_timestamp AS departureTimestamp,
                first_leg_stop_times_a.stop_sequence AS firstStopSequence,
                first_leg_stop_times_a.stop_id AS firstStopId,
                CASE
                    WHEN first_leg_stop_times_b.stop_id = (?)
                        THEN first_leg_stop_times_b.arrival_time
                    WHEN last_leg_stop_times.stop_id = (?)
                        THEN last_leg_stop_times.arrival_time
                END AS arrivalTime,
                CASE
                    WHEN first_leg_stop_times_b.stop_id = (?)
                        THEN first_leg_stop_times_b.arrival_timestamp
                    WHEN last_leg_stop_times.stop_id = (?)
                        THEN last_leg_stop_times.arrival_timestamp
                END AS arrivalTimestamp,
                CASE
                    WHEN first_leg_stop_times_b.stop_id = (?)
                        THEN first_leg_stop_times_b.stop_sequence
                    WHEN last_leg_stop_times.stop_id = (?)
                        THEN last_leg_stop_times.stop_sequence
                END AS lastStopSequence,
                CASE
                    WHEN first_leg_stop_times_b.stop_id = (?)
                        THEN first_leg_stop_times_b.stop_id
                    WHEN last_leg_stop_times.stop_id = (?)
                        THEN last_leg_stop_times.stop_id
                END AS lastStopId
            FROM trips 
            JOIN translations AS trip_short_name_translations
                ON trip_short_name_translations.table_name = 'trips'
                    AND trip_short_name_translations.field_name = 'trip_short_name'
                    AND trips.trip_id = trip_short_name_translations.record_id
            JOIN translations AS trip_headsign_translations
                ON trip_headsign_translations.table_name = 'trips'
                    AND trip_headsign_translations.field_name = 'trip_headsign'
                    AND trips.trip_id = trip_headsign_translations.record_id
            JOIN routes ON trips.route_id = routes.route_id
            JOIN translations AS route_translations
                ON route_translations.table_name = 'routes'
                    AND route_translations.field_name = 'route_short_name'
                    AND routes.route_id = route_translations.record_id
            JOIN agency ON routes.agency_id = agency.agency_id
            JOIN translations AS agency_name_translations
                ON agency_name_translations.table_name = 'agency'
                    AND agency_name_translations.field_name = 'agency_name'
                    AND agency.agency_id = agency_name_translations.record_id
            JOIN translations AS agency_url_translations
                ON agency_url_translations.table_name = 'agency'
                    AND agency_url_translations.field_name = 'agency_url'
                    AND agency.agency_id = agency_url_translations.record_id
            LEFT JOIN transfers 
                ON trips.trip_id = transfers.from_trip_id 
            LEFT JOIN trips AS to_trips 
                ON to_trips.trip_id = transfers.to_trip_id
            LEFT JOIN routes AS to_routes ON to_trips.route_id = to_routes.route_id
            LEFT JOIN translations AS to_route_translations
                ON to_route_translations.table_name = 'routes'
                    AND to_route_translations.field_name = 'route_short_name'
                    AND to_routes.route_id = to_route_translations.record_id
            LEFT JOIN agency AS to_agency ON to_routes.agency_id = to_agency.agency_id
            LEFT JOIN translations AS to_agency_name_translations
                ON to_agency_name_translations.table_name = 'agency'
                    AND to_agency_name_translations.field_name = 'agency_name'
                    AND to_agency.agency_id = to_agency_name_translations.record_id
            LEFT JOIN translations AS to_agency_url_translations
                ON to_agency_url_translations.table_name = 'agency'
                    AND to_agency_url_translations.field_name = 'agency_url'
                    AND agency.agency_id = to_agency_url_translations.record_id
            JOIN stop_times AS first_leg_stop_times_a
                ON trips.trip_id = first_leg_stop_times_a.trip_id
            JOIN stop_times AS first_leg_stop_times_b
                ON trips.trip_id = first_leg_stop_times_b.trip_id
            LEFT JOIN stop_times AS last_leg_stop_times
                ON to_trips.trip_id = last_leg_stop_times.trip_id
            WHERE trips.service_id = (?)
                AND first_leg_stop_times_a.stop_id = (?)
                AND (
                    (
                        first_leg_stop_times_b.stop_id = (?)
                            AND 
                        first_leg_stop_times_a.stop_sequence < first_leg_stop_times_b.stop_sequence
                    ) OR (
                        last_leg_stop_times.stop_id = (?)
                            AND
                        first_leg_stop_times_a.stop_sequence < last_leg_stop_times.stop_sequence
                    )
                )
            GROUP BY trips.trip_id
            ORDER BY MIN(first_leg_stop_times_a.departure_timestamp);
        `, ...Array(8).fill(endStopId), serviceId, startStopId, endStopId, endStopId);

    getTrip = async (tripId: string) =>
        this.get<Trip>(`
            SELECT 
                trips.trip_id AS id, 
                trips.service_id AS service, 
                trips.trip_headsign AS headsign, 
                trips.trip_short_name AS shortName, 
                trips.direction_id AS direction,
                trip_short_name_translations.translation AS shortNameEn,
                trip_headsign_translations.translation AS headsignEn,
                routes.route_id AS routeId, 
                routes.route_short_name AS routeName,
                routes.route_color AS routeColor,
                route_translations.translation AS routeNameEn,
                agency.agency_id AS agencyId,
                agency.agency_name AS agencyName,
                agency.agency_url AS agencyUrl,
                agency_translations.translation AS agencyNameEn
            FROM trips
            JOIN translations AS trip_short_name_translations
                ON trip_short_name_translations.table_name = 'trips'
                    AND trip_short_name_translations.field_name = 'trip_short_name'
                    AND trips.trip_id = trip_short_name_translations.record_id
            JOIN translations AS trip_headsign_translations
                ON trip_headsign_translations.table_name = 'trips'
                    AND trip_headsign_translations.field_name = 'trip_headsign'
                    AND trips.trip_id = trip_headsign_translations.record_id
            JOIN routes ON trips.route_id = routes.route_id
            JOIN translations AS route_translations
                ON route_translations.table_name = 'routes'
                    AND route_translations.field_name = 'route_short_name'
                    AND routes.route_id = route_translations.record_id
            JOIN agency ON routes.agency_id = agency.agency_id
            JOIN translations AS agency_translations
                ON agency_translations.table_name = 'agency'
                    AND agency_translations.field_name = 'agency_name'
                    AND agency.agency_id = agency_translations.record_id
            WHERE trips.trip_id = (?)
        `, tripId);

    getTripStopTimes = async (
        tripId: string, 
        startStopSeq = 0, 
        endStopSeq = Number.MAX_SAFE_INTEGER
    ) => this.all<StopTime>(`
        SELECT
            arrival_time AS arrivalTime, 
            arrival_timestamp AS arrivalTimestamp,
            departure_time AS departureTime,
            departure_timestamp AS departureTimestamp,
            stop_sequence AS seq,
            shape_dist_traveled AS distanceTraveled,
            stops.stop_id AS id,
            stops.stop_name AS name,
            stops.stop_lat AS lat,
            stops.stop_lon AS lon,
            translations.translation AS nameEn
        FROM stop_times
        JOIN stops ON stop_times.stop_id = stops.stop_id
        JOIN translations ON translations.record_id = stop_times.stop_id
        WHERE (
            stop_times.trip_id = (?)
                OR stop_times.trip_id IN (
                    SELECT to_trip_id
                    FROM transfers
                    WHERE from_trip_id = (?)
                )
        ) AND stop_sequence >= (?)
            AND stop_sequence <= (?)
        ORDER BY stop_sequence
    `, tripId, tripId, startStopSeq, endStopSeq);

    getTripShapes = async (
        tripId: string, 
        startShapeDist = 0, 
        endShapeDist = Number.MAX_SAFE_INTEGER
    ) => this.all<Shape>(`
        SELECT 
            shape_pt_lat AS lat,
            shape_pt_lon AS lon,
            shape_pt_sequence AS seq
        FROM shapes 
        WHERE (
            shape_id = (?)
                AND shape_dist_traveled >= (?)
                AND shape_dist_traveled <= (?)
        )
        ORDER BY shape_pt_sequence;
    `, tripId + '_shp', startShapeDist, endShapeDist);

    getTripTransfer = async (tripId: string) =>
        this.get<Transfers>(
            'SELECT * FROM transfers WHERE from_trip_id = (?)',
            tripId
        );
}

export const db = new TransitDatabase('./gtfs.db');