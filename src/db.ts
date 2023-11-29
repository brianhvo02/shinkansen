import sqlite3 from 'sqlite3';
import { Shape, Stop, StopTime, TranslationsMap, Trip, TripWithTimes } from './types';
import { Translations, TranslationsTableName } from 'gtfs-types';
import _ from 'lodash';
import { getTranslations, openDb } from 'gtfs';

export default class TransitDatabase {
    db: sqlite3.Database;
    mappedTranslations: TranslationsMap;

    private constructor(db: sqlite3.Database, mappedTranslations: TranslationsMap) {
        this.db = db;
        this.mappedTranslations = mappedTranslations;
    }

    static async init(path: string) {
        const db = new sqlite3.Database(path);
        const translations = await new Promise<Translations[]>((resolve, reject) => 
            db.all<Translations>('SELECT * FROM translations', (err, rows) => err ? reject(err) : resolve(rows))
        );
        const mappedTranslations = translations.reduce((mappedTranslations: TranslationsMap, { 
            table_name, field_name, language, translation, record_id 
        }) => {
            if (!record_id)
                return mappedTranslations;
        
            if (!mappedTranslations[table_name])
                mappedTranslations[table_name] = {};
        
            if (!mappedTranslations[table_name][field_name])
                mappedTranslations[table_name][field_name] = {};
        
            if (!mappedTranslations[table_name][field_name][record_id])
                mappedTranslations[table_name][field_name][record_id] = {};
        
            mappedTranslations[table_name][field_name][record_id][language] = translation;
        
            return mappedTranslations;
        }, {});

        return new this(db, mappedTranslations);
    }

    close = async () => new Promise<void>((resolve, reject) => 
        this.db.close(err => err ? reject(err) : resolve())
    );

    async get<T>(sql: string): Promise<T>;
    async get<T>(sql: string, params: (string | number)[]): Promise<T>;
    async get<T>(sql: string, ...params: (string | number)[]): Promise<T>;
    async get<T>(sql: string, ...params: (string | number | (string | number)[])[]) {
        return new Promise<T>((resolve, reject) => 
            this.db.get<T>(
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
        LEFT JOIN translations ON stops.stop_id = translations.record_id
        WHERE stop_id IN (
            SELECT DISTINCT stop_id
            FROM stop_times
        )
        ORDER BY nameEn
    `);

    async getTripsByStops(serviceId: string, startStopId: string, endStopId: string) {
        const trips = await this.all<TripWithTimes>(`
            SELECT 
                trips.trip_id AS id, 
                trips.route_id AS routeId, 
                trips.service_id AS service, 
                trips.trip_headsign AS headsign, 
                trips.trip_short_name AS shortName, 
                trips.direction_id AS direction,
                stop_times.arrival_times AS arrivalTimes,
                stop_times.arrival_timestamps AS arrivalTimestamps,
                stop_times.departure_times AS departureTimes,
                stop_times.departure_timestamps AS departureTimestamps,
                stop_times.stop_sequences AS stopSequences
            FROM trips 
            JOIN (
                SELECT trip_id, 
                    GROUP_CONCAT(arrival_time) AS arrival_times, 
                    GROUP_CONCAT(arrival_timestamp) AS arrival_timestamps, 
                    GROUP_CONCAT(departure_time) AS departure_times, 
                    GROUP_CONCAT(departure_timestamp) AS departure_timestamps,
                    GROUP_CONCAT(stop_id) AS stop_ids,
                    GROUP_CONCAT(stop_sequence) AS stop_sequences
                FROM (
                    SELECT *
                    FROM stop_times
                    ORDER BY departure_time
                ) 
                WHERE trip_id IN (
                    SELECT DISTINCT trip_id 
                    FROM stop_times 
                    WHERE stop_id = (?)
                ) AND trip_id IN (
                    SELECT DISTINCT trip_id 
                    FROM stop_times 
                    WHERE stop_id = (?)
                ) AND (
                    stop_id = (?)
                        OR
                    stop_id = (?)
                )
                GROUP BY trip_id
                HAVING stop_ids = (?)
            ) AS stop_times ON stop_times.trip_id = trips.trip_id
            WHERE service_id = (?)
            ORDER BY departure_timestamps;
        `, startStopId, endStopId, startStopId, endStopId, [startStopId, endStopId].join(','), serviceId);

        trips.forEach(trip => {
            trip.headsignEn = db.mappedTranslations.trips.trip_headsign[trip.id].en;
            trip.shortNameEn = db.mappedTranslations.trips.trip_short_name[trip.id].en;
            return trip;
        });

        return trips;
    }

    getTrip = async (tripId: string) =>
        this.get<Trip>(`
            SELECT 
                trip_id AS id, 
                route_id AS routeId, 
                service_id AS service, 
                trip_headsign AS headsign, 
                trip_short_name AS shortName, 
                direction_id AS direction
            FROM trips
            WHERE trip_id = (?)
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
        WHERE trip_id = (?)
            AND stop_sequence >= (?)
            AND stop_sequence <= (?)
        ORDER BY stop_sequence
    `, tripId, startStopSeq, endStopSeq);

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
        WHERE shape_id = (?)
            AND shape_dist_traveled >= (?)
            AND shape_dist_traveled <= (?)
        ORDER BY shape_pt_sequence
    `, tripId + '_shp', startShapeDist, endShapeDist);
}

export const db = await TransitDatabase.init('./gtfs.db');