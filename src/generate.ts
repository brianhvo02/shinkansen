
import { load } from 'cheerio';
import _ from 'lodash';
import { mkdir, rm, writeFile } from 'fs/promises';
import { RouteId, TransferType, dictionary, transferMap } from './dictionary.js';
import { agency, calendar, feed_info, routes, translations } from './info.js';
import type { Shapes, Stop, StopTime, Trip } from 'gtfs-types';
import { TranslationsTableName } from 'gtfs-types';
import type { Feature, FeatureCollection, LineString, Position } from 'geojson';
import { importGtfs } from 'gtfs';
import { haversineDistance } from './utils.js';
import type { Transfers } from './types';

const segments: Record<string, Position[][]> = Object.fromEntries(
    await Promise.all(
        routes.map(async ({ route_id }) => 
            [
                route_id, 
                await fetch(`https://japantravel.navitime.com/en/area/jp/async/transport/shape?link=${
                    route_id
                }&direction=down`)
                    .then(res => res.json())
                    .then((collection: FeatureCollection<LineString>) => collection.features.map(feature => feature.geometry.coordinates))
                    .then(async coordinates => {
                        if (route_id === '00000182' || route_id === '00000177') {
                            const moreCoordinates = await fetch(`https://japantravel.navitime.com/en/area/jp/async/transport/shape?link=${
                                route_id === '00000182' ? '00000928' : '00001229'
                            }&direction=down`)
                                .then(res => res.json())
                                .then((collection: FeatureCollection<LineString>) => collection.features.map(feature => feature.geometry.coordinates));
                            return coordinates.concat(moreCoordinates.slice(route_id === '00000177' ? 0 : 3));
                        }
                        return coordinates;
                    })
            ]
        )
    )
);

const trips: Trip[] = [];
const stops: Record<string, Stop> = {};
const stop_times: StopTime[] = [];
const allTrains: [string, 0 | 1, string][] = [];
const shapes: Shapes[] = [];
const transfers: Transfers[] = [];

const getTimes = ($: cheerio.Root, service_id: string) => [
    $(`#${service_id}-0`).get(0),
    $(`#${service_id}-1`).get(0)
].flatMap((dirEl, dir) => $(dirEl)
    .find('.time-frame')
    .toArray()
    .reduce((arr: [string, 0 | 1, string][], el) => {
        if (Object.keys(dictionary).includes($(el).data('name')) && $(el).data('first') === 'first') {
            const link = $(el).find('a').attr('href');
            if (link)
                arr.push([service_id, dir as 0 | 1, link]);
        }
        return arr;
    }, []
    )
);

const getStopInfo = ($: cheerio.Root, offset: number, el: cheerio.Element, i: number) => {
    const stop_id = $(el)
        .find('.timetable')
        .attr('href')
        ?.split('/')[7];
    const stop_name = $(el)
        .find('.stop-station__item__name-area__name__link__ja')
        .text()
        .replace('(', '（')
        .replace(')', '）');
    const translation = $(el).data('name').replace('(', ' (');

    if (stop_id && !stops[stop_id]) {
        translations.push({
            table_name: TranslationsTableName.STOPS,
            field_name: 'stop_name',
            language: 'en',
            translation,
            record_id: stop_id
        });
        dictionary[stop_name] = translation;
        stops[stop_id] = {
            stop_id,
            stop_name,
            stop_lat: $(el).data('lat'),
            stop_lon: $(el).data('lon')
        };
    }

    return [stop_id, i + offset];
}

const stopIds = await Promise.all(
    routes.map(async ({ route_id }) => {
        const stationList = await fetch(`https://japantravel.navitime.com/en/area/jp/railroad/${route_id}/`)
            .then(res => res.text());

        const stationList2 = route_id === '00000182' || route_id === '00000177'
            ? await fetch(`https://japantravel.navitime.com/en/area/jp/railroad/${
                route_id === '00000182' ? '00000928' : '00001229'
            }/`).then(res => res.text()) : null;

        const $1 = load(stationList);
        const $2 = stationList2 && load(stationList2);

        const stopIds = $1('.stop-station__item')
            .toArray()
            .map(getStopInfo.bind(null, $1, 0));

        const trains = await Promise.all(
            stopIds.map(async ([stopId]) => {
                const page = await fetch(`https://www.navitime.co.jp/diagram/timetable?node=${stopId}&lineId=${route_id}`)
                    .then(res => res.text());
                const $3 = load(page);
                return [
                    ...getTimes($3, 'weekday'), 
                    ...getTimes($3, 'saturday'), 
                    ...getTimes($3, 'holiday')
                ];
            })
        ).then(arr => arr.flat());

        allTrains.push(...trains);

        if ($2) {
            const moreStopIds = $2('.stop-station__item')
                .toArray()
                .slice(route_id === '00000177' ? 0 : 4)
                .map(getStopInfo.bind(null, $2, stopIds.length))

            const trains = await Promise.all(
                moreStopIds.map(async ([stopId]) => {
                    const page = await fetch(`https://www.navitime.co.jp/diagram/timetable?node=${
                        stopId
                    }&lineId=${
                        route_id === '00000182' ? '00000928' : '00001229'
                    }`).then(res => res.text());
                    const $3 = load(page);
                    return [
                        ...getTimes($3, 'weekday'), 
                        ...getTimes($3, 'saturday'), 
                        ...getTimes($3, 'holiday')
                    ];
                })
            ).then(arr => arr.flat());

            stopIds.push(...moreStopIds);
            allTrains.push(...trains);
        }

        return [route_id, Object.fromEntries(stopIds)];
    })
).then(arr => Object.fromEntries(arr));

const findStopIdx = (routeId: string, stopId: string): [RouteId, number] => {
    const idx = stopIds[routeId][stopId];
    if (idx !== undefined) return [routeId as RouteId, idx];

    let otherStops;

    switch (routeId) {
        case '00000110':
            otherStops = _.pick(stopIds, ['00000069', '00000185']);
            break;
        case '00000069':
            otherStops = _.pick(stopIds, ['00000110', '00001017']);
            break;
        case '00001017':
            otherStops = _.pick(stopIds, ['00000069']);
            break;
        case '00000185':
            otherStops = _.pick(stopIds, ['00000110', '00001242', '00000122', '00000182']);
            break;
        case '00001242':
            otherStops = _.pick(stopIds, ['00000185']);
            break;
        case '00000122':
            otherStops = _.pick(stopIds, ['00000185']);
            break;
        case '00000182':
            otherStops = _.pick(stopIds, ['00000185']);
            break;
        default:
            otherStops = _.omit(stopIds, routeId);
    }

    for (const [route, stopsMap] of Object.entries(otherStops)) {
        if (stopsMap[stopId] !== undefined) 
            return [route as RouteId, stopsMap[stopId]];
    }

    return ['', -1];
}

//
const DEBUG =  null; // '/diagram/stops/00000928/02b3003a/?node=00003492&year=2023&month=12&day=01&from=timetable';

for (const [service_id, direction_id, url] of allTrains) {
    if (DEBUG && url !== DEBUG) continue;

    const page = await fetch(`https://www.navitime.co.jp${url}`)
        .then(res => res.text());
    const $ = load(page);

    const routeId = url.split('/')[3] === '00000928' 
        ? '00000182' 
        : url.split('/')[3] === '00001229'
            ? '00000177'
            : url.split('/')[3];

    const firstStopId = $('.stops').first().find('.station-name-link').attr('href')?.split('=')[1] ?? '';
    const lastStopId = $('.stops').last().find('.station-name-link').attr('href')?.split('=')[1] ?? '';
    const [startRoute, firstStopIdx] = findStopIdx(routeId, firstStopId);
    const [endRoute, lastStopIdx] = findStopIdx(routeId, lastStopId);

    if (startRoute !== endRoute) {
        transfers.push({
            from_route_id: startRoute,
            to_route_id: endRoute,
            from_trip_id:  `${url.split('/')[4]}_${service_id}_${startRoute}`,
            to_trip_id:  `${url.split('/')[4]}_${service_id}_${endRoute}`,
            transfer_type: TransferType.IN_SEAT
        })
    }
    
    const startSegments = (startRoute === endRoute 
        ? [...segments[startRoute]]
            .slice(Math.min(firstStopIdx, lastStopIdx), Math.max(firstStopIdx, lastStopIdx))
        : [...segments[startRoute]]
            .slice(
                ...(startRoute === '00000185' && endRoute === '00000122'
                    ? [firstStopIdx, 8]
                    : startRoute === '00000185' && endRoute === '00000182'
                        ? [firstStopIdx, 17]
                        : direction_id 
                            ? [firstStopIdx] 
                            : [0, firstStopIdx]
                )
            )
    ).flat();

    const endSegments = (startRoute === endRoute 
        ? []
        : [...segments[endRoute]]
            .slice(
                ...(startRoute === '00000122' && endRoute === '00000185'
                    ? [lastStopIdx, 8]
                    : startRoute === '00000182' && endRoute === '00000185'
                        ? [lastStopIdx, 17]
                        : direction_id 
                            ? [0, lastStopIdx] 
                            : [lastStopIdx]
                )
            )
    ).flat();

    if (!direction_id) {
        startSegments.reverse();
        endSegments.reverse();
    }

    const tripSegments = [startSegments, endSegments].map((seg, i) => {
        if (!seg.length)
            return [];

        const trip_id = `${url.split('/')[4]}_${service_id}_${i ? endRoute : startRoute}`;

        const trip_headsign = $('.station-name-link').last().text();
        const trip_short_name = $('.head-txt').text();
    
        const shape_id = `${trip_id}_shp`;
    
        console.log(service_id.padEnd(8, ' '), trip_short_name);
    
        trips.push({
            trip_id,
            route_id: i ? endRoute : startRoute,
            service_id,
            trip_headsign,
            trip_short_name,
            direction_id,
            shape_id
        });
    
        translations.push({
            table_name: TranslationsTableName.TRIPS,
            field_name: 'trip_headsign',
            language: 'en',
            translation: dictionary[trip_headsign],
            record_id: trip_id
        });
    
        translations.push({
            table_name: TranslationsTableName.TRIPS,
            field_name: 'trip_short_name',
            language: 'en',
            translation: `${
                dictionary[trip_short_name.slice(0, trip_short_name.match(/\d/)?.index)]
            } ${
                trip_short_name.match(/\d+/)?.[0]
            }`,
            record_id: trip_id
        });
    
        const tripShape = seg
            .reduce((shapes: Shapes[], segment, i) => {
                const prevShape = shapes[i - 1];
                const shape_dist_traveled = i > 0 && prevShape.shape_dist_traveled !== undefined
                    ? prevShape.shape_dist_traveled + haversineDistance(
                        [prevShape.shape_pt_lon, prevShape.shape_pt_lat], 
                        segment
                    ) : 0;
                shapes.push({
                    shape_id,
                    shape_pt_lat: segment[1],
                    shape_pt_lon: segment[0],
                    shape_pt_sequence: i,
                    shape_dist_traveled
                });
                return shapes;
            }, []);
            
        shapes.push(...tripShape);

        return tripShape;
    });

    let isEndSegment = false;

    const tripStopTimes = $('.stops').toArray().reduce((arr: StopTime[], el, i) => {
        const time = $(el).find('.time').text();
        const fromToTime = $(el).find('.from-to-time').text();
        const stop_id = $(el).find('.station-name-link').attr('href')?.split('=')[1];
        if (!stop_id) return arr;
        if (startRoute !== endRoute && i > 0 && transferMap[endRoute].includes(stop_id)) {
            isEndSegment = true;
        }

        const stop = stops[stop_id];
        const [shapeIdx] = tripSegments[Number(isEndSegment)].reduce(([idx, dist]: number[], shape, j) => {
            const shapeDist = haversineDistance([stop.stop_lon ?? 0, stop.stop_lat ?? 0], [shape.shape_pt_lon, shape.shape_pt_lat]);
            return shapeDist < dist
                ? [j, shapeDist]
                : [idx, dist];
        }, [-1, Infinity]);

        return arr.concat({
            trip_id: `${url.split('/')[4]}_${service_id}_${isEndSegment ? endRoute : startRoute}`,
            arrival_time: (time.length ? time.slice(0, -1) : fromToTime.slice(0, 5)) + ':00',
            departure_time: (time.length ? time.slice(0, -1) : fromToTime.slice(6, 11)) + ':00',
            stop_id,
            stop_sequence: i,
            timepoint: 1,
            shape_dist_traveled: tripSegments[Number(isEndSegment)][shapeIdx].shape_dist_traveled
        });
    }, []);

    stop_times.push(...tripStopTimes);

    if (DEBUG)
        break;
}

if (DEBUG) {
    const features: Feature<LineString>[] = trips.map(trip => {
        return {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: shapes
                    .filter(shape => shape.shape_id === trip.shape_id)
                    .map(shapePt => [
                        shapePt.shape_pt_lon, 
                        shapePt.shape_pt_lat
                    ])
            },
            properties: trip,
            id: trip.trip_id
        }
    });

    if (features.length === 2) {
        const transferCoordinatesA = features[0].geometry.coordinates;
        const transferCoordinatesB = features[1].geometry.coordinates;
        features.push({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    transferCoordinatesA[transferCoordinatesA.length - 1],
                    transferCoordinatesB[0]
                ]
            },
            properties: {},
            id: 'transfer'
        });
    }

    const collection = {
        type: 'FeatureCollection',
        features
    };
    
    await writeFile('output.geojson', JSON.stringify(collection))
} else {
    await rm('./gtfs', { recursive: true, force: true });
    await mkdir('./gtfs', { recursive: true });
    
    const writeGTFSFile = async (name: string, arr: any[]) => {
        const header = Object.keys(arr[0]).join(',');
        const lines = [header, ...arr.map(obj => Object.values(obj).join(','))].join('\n');
        return writeFile(`./gtfs/${name}.txt`, lines);
    }
    
    Object.entries({
        agency, routes, calendar, trips, 
        stop_times, stops: Object.values(stops), 
        shapes, transfers, translations, feed_info
    }).map(pair => writeGTFSFile(...pair));
    
    console.log(agency.length, 'agency');
    console.log(routes.length, 'routes');
    console.log(calendar.length, 'calendar');
    console.log(Object.keys(stops).length, 'stops');
    console.log(trips.length, 'trips');
    console.log(stop_times.length, 'stop_times');
    console.log(shapes.length, 'shapes');
    console.log(translations.length, 'translations');
    console.log(transfers.length, 'transfers');

    await importGtfs({
        agencies: [
            { path: './gtfs' }
        ],
        sqlitePath: './gtfs.db'
    });
}
