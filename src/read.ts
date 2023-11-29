import { existsSync } from 'fs';
import { getShapes, getStops, getStoptimes, getTranslations, getTrips, importGtfs, openDb } from 'gtfs';
import { createServer } from 'node:http';
import { dictionary as reverseDictionary } from './dictionary.js';
import { Shapes, Stop, StopTime, TranslationsTableName, Trip } from 'gtfs-types';
import { Feature, FeatureCollection, Point } from 'geojson';

if (!existsSync('./gtfs.db')) {
    await importGtfs({
        agencies: [
            { path: './gtfs' }
        ],
        sqlitePath: './gtfs.db'
    });
}

openDb({ sqlitePath: './gtfs.db' });

const dictionary = Object.fromEntries(
    Object.entries(reverseDictionary)
        .map(entry => entry.reverse())
);

const server = createServer((req, res) => {
    const [name, number] = req.url?.slice(req.url.lastIndexOf('/') + 1).split('%20') ?? [];
    const train = dictionary[name] + number + '号';
    console.log(train);

    const trips = getTrips({
        trip_short_name: train,
        service_id: 'weekday'
    });
    if (!trips.length) return res.end();
    const trip = trips[0] as Trip;

    const headsignTranslations = getTranslations({
        table_name: TranslationsTableName.TRIPS,
        field_name: 'trip_headsign',
        record_id: trip.trip_id,
    });
    if (!headsignTranslations.length) return res.end();
    const trip_headsign = headsignTranslations[0].translation;

    const shortNameTranslations = getTranslations({
        table_name: TranslationsTableName.TRIPS,
        field_name: 'trip_short_name',
        record_id: trip.trip_id,
    });
    if (!headsignTranslations.length) return res.end();
    const trip_short_name = shortNameTranslations[0].translation;

    const shapes = getShapes({ shape_id: trip.shape_id }, undefined, [['shape_pt_sequence', 'ASC']]) as Shapes[];

    const stopTimes = getStoptimes({ trip_id: trip.trip_id }, undefined, [['stop_sequence', 'ASC']]) as StopTime[];

    const stopPoints: Feature<Point, Stop>[] = stopTimes.map((stopTime, i) => {
        const [stop] = getStops({ stop_id: stopTime.stop_id });
        const stop_name = getTranslations({
            table_name: TranslationsTableName.STOPS,
            field_name: 'stop_name',
            record_id: stopTime.stop_id,
        })[0].translation;

        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [
                    stop.stop_lon,
                    stop.stop_lat
                ]
            },
            properties: {
                ...stop,
                ...stopTime,
                stop_name
            },
            id: i + 1
        };
    });

    const collection: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: shapes.map(shape => [
                        shape.shape_pt_lon, 
                        shape.shape_pt_lat
                    ])
                },
                properties: {
                    ...trip,
                    trip_headsign,
                    trip_short_name
                },
                id: 0
            },
            ...stopPoints
        ]
    };
    
    res.writeHead(200, { 
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/geo+json' 
    });
    res.end(JSON.stringify(collection));
});

server.listen(3000, () => console.log('https://geojson.io/#data=data:text/x-url,http://localhost:3000/'));

// [...document.getElementsByClassName('timetable-area__list--definition')]
//     .forEach(el => el.addEventListener('click', e => {
//         window.open(`https://geojson.io/#data=data:text/x-url,http://localhost:3000/${el.dataset.long}`)
//     }));