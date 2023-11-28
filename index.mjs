
import { load } from 'cheerio';
import _ from 'lodash';
import { mkdir, rm, writeFile } from 'fs/promises';

const feed_info = [{
    feed_publisher_name: 'NAVITIME JAPAN',
    feed_publisher_url: 'https://www.navitime.co.jp/',
    feed_lang: 'jp',
    feed_start_date: '20231120',
    feed_end_date: '20240219',
    feed_version: '20231120',
    feed_contact_email: 'me@brianhuyvo.com'
}];

const agency = [
    {
        agency_id: 'jr_central',
        agency_name: '東海旅客鉄道株式会社',
        agency_url: 'https://jr-central.co.jp/',
        agency_timezone: 'Asia/Tokyo'
    },
    {
        agency_id: 'jr_west',
        agency_name: '西日本旅客鉄道株式会社',
        agency_url: 'https://www.westjr.co.jp/',
        agency_timezone: 'Asia/Tokyo'
    },
    {
        agency_id: 'jr_kyushu',
        agency_name: '九州旅客鉄道株式会社',
        agency_url: 'https://www.jrkyushu.co.jp/',
        agency_timezone: 'Asia/Tokyo'
    },
    {
        agency_id: 'jr_east',
        agency_name: '東日本旅客鉄道株式会社',
        agency_url: 'https://www.jreast.co.jp/',
        agency_timezone: 'Asia/Tokyo'
    },
    {
        agency_id: 'jr_hokkaido',
        agency_name: '北海道旅客鉄道株式会社',
        agency_url: 'https://www.jrhokkaido.co.jp/index.html',
        agency_timezone: 'Asia/Tokyo'
    },
];

const routes = [
    {
        route_id: '00000110',
        agency_id: 'jr_central',
        route_short_name: '東海道新幹線',
        route_type: 2,
        route_color: '1153AF'
    },
    {
        route_id: '00000069',
        agency_id: 'jr_west',
        route_short_name: '山陽新幹線',
        route_type: 2,
        route_color: '24197C'
    },
    {
        route_id: '00001017',
        agency_id: 'jr_kyushu',
        route_short_name: '九州新幹線',
        route_type: 2,
        route_color: '24197C'
    },
    {
        route_id: '00000185',
        agency_id: 'jr_east',
        route_short_name: '東北新幹線',
        route_type: 2,
        route_color: '41934C'
    },
    {
        route_id: '00001242',
        agency_id: 'jr_hokkaido',
        route_short_name: '北海道新幹線',
        route_type: 2,
        route_color: '9ACD32'
    },
    {
        route_id: '00000122',
        agency_id: 'jr_east',
        route_short_name: '山形新幹線',
        route_type: 2,
        route_color: 'F36221'
    },
    {
        route_id: '00000182',
        agency_id: 'jr_east',
        route_short_name: '秋田新幹線',
        route_type: 2,
        route_color: 'CC00CC'
    },
];

const translations = [
    {
        table_name: 'agency',
        field_name: 'agency_name',
        language: 'en',
        translation: 'Central Japan Railway Company',
        record_id: 'jr_central'
    },
    {
        table_name: 'agency',
        field_name: 'agency_name',
        language: 'en',
        translation: 'West Japan Railway Company',
        record_id: 'jr_west'
    },
    {
        table_name: 'agency',
        field_name: 'agency_name',
        language: 'en',
        translation: 'Kyushu Railway Company',
        record_id: 'jr_kyushu'
    },
    {
        table_name: 'agency',
        field_name: 'agency_name',
        language: 'en',
        translation: 'East Japan Railway Company',
        record_id: 'jr_east'
    },
    {
        table_name: 'agency',
        field_name: 'agency_name',
        language: 'en',
        translation: 'Hokkaido Railway Company',
        record_id: 'jr_hokkaido'
    },
    {
        table_name: 'routes',
        field_name: 'route_short_name',
        language: 'en',
        translation: 'Tokaido Shinkansen',
        record_id: '00000110'
    },
    {
        table_name: 'routes',
        field_name: 'route_short_name',
        language: 'en',
        translation: 'San\'yō Shinkansen',
        record_id: '00000069'
    },
    {
        table_name: 'routes',
        field_name: 'route_short_name',
        language: 'en',
        translation: 'Kyushu Shinkansen',
        record_id: '00001017'
    },
    {
        table_name: 'routes',
        field_name: 'route_short_name',
        language: 'en',
        translation: 'Tōhoku Shinkansen',
        record_id: '00000185'
    },
    {
        table_name: 'routes',
        field_name: 'route_short_name',
        language: 'en',
        translation: 'Hokkaido Shinkansen',
        record_id: '00001242'
    },
    {
        table_name: 'routes',
        field_name: 'route_short_name',
        language: 'en',
        translation: 'Yamagata Shinkansen',
        record_id: '00000122'
    },
    {
        table_name: 'routes',
        field_name: 'route_short_name',
        language: 'en',
        translation: 'Akita Shinkansen',
        record_id: '00000182'
    },
    {
        table_name: 'agency',
        field_name: 'agency_url',
        language: 'en',
        translation: 'https://global.jr-central.co.jp/en/',
        record_id: 'jr_central'
    },
    {
        table_name: 'agency',
        field_name: 'agency_url',
        language: 'en',
        translation: 'https://www.westjr.co.jp/global/en/',
        record_id: 'jr_west'
    },
    {
        table_name: 'agency',
        field_name: 'agency_url',
        language: 'en',
        translation: 'https://www.jrkyushu.co.jp/english/',
        record_id: 'jr_kyushu'
    },
    {
        table_name: 'agency',
        field_name: 'agency_url',
        language: 'en',
        translation: 'https://www.jreast.co.jp/multi/en/',
        record_id: 'jr_east'
    },
    {
        table_name: 'agency',
        field_name: 'agency_url',
        language: 'en',
        translation: 'https://www.jrhokkaido.co.jp/global/',
        record_id: 'jr_hokkaido'
    },
    {
        table_name: 'feed_info',
        field_name: 'feed_publisher_url',
        language: 'en',
        translation: 'https://japantravel.navitime.com/en/',
        record_id: ''
    },
];

const calendar = [
    {
        service_id: 'weekday',
        monday: 1,
        tuesday: 1,
        wednesday: 1,
        thursday: 1,
        friday: 1,
        saturday: 0,
        sunday: 0,
        start_date: '20231120',
        end_date: '20240219'
    },
    {
        service_id: 'saturday',
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 1,
        sunday: 0,
        start_date: '20231120',
        end_date: '20240219'
    },
    {
        service_id: 'holiday',
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
        sunday: 1,
        start_date: '20231120',
        end_date: '20240219'
    }
];

const dictionary = {
    'のぞみ': 'Nozomi',
    'ひかり': 'Hikari',
    'こだま': 'Kodama',
    'さくら': 'Sakura',
    'みずほ': 'Mizuho',
    'つばめ': 'Tsubame',
    'なすの': 'Nasuno',
    'やまびこ': 'Yamabiko',
    'はやぶさ': 'Hayabusa',
    'はやて': 'Hayate',
    'つばさ': 'Tsubasa',
    'こまち': 'Komachi',
};

const segments = Object.fromEntries(
    await Promise.all(
        routes.map(async ({ route_id }) => 
            [
                route_id, 
                await fetch(`https://japantravel.navitime.com/en/area/jp/async/transport/shape?link=${
                    route_id
                }&direction=down`)
                    .then(res => res.json())
                    .then(collection => collection.features.map(feature => feature.geometry.coordinates))
                    .then(async coordinates => {
                        if (route_id === '00000182') {
                            const moreCoordinates = await fetch(`https://japantravel.navitime.com/en/area/jp/async/transport/shape?link=00000928&direction=down`)
                                .then(res => res.json())
                                .then(collection => collection.features.map(feature => feature.geometry.coordinates));
                            return coordinates.concat(moreCoordinates.slice(3));
                        }
                        return coordinates;
                    })
            ]
        )
    )
);

const trips = [];
const stops = {};
const stop_times = [];
const allTrains = [];
const shapes = [];

const getTimes = ($, service_id) => [
    $(`#${service_id}-0`).get(0),
    $(`#${service_id}-1`).get(0)
].flatMap((dirEl, dir) => $(dirEl)
    .find('.time-frame')
    .toArray()
    .reduce((arr, el) => {
        if (Object.keys(dictionary).includes($(el).data('name')) && $(el).data('first') === 'first') {
            // console.log($(el).find('a').attr('href'))
            return arr.concat([[service_id, dir, $(el).find('a').attr('href')]])
        } else {
            return arr;
        }
    }, []
    )
);

const getStopIds = ($, offset, el, i) => {
    const stop_id = $(el)
        .find('.timetable')
        .attr('href')
        .split('/')[7];
    const stop_name = $(el)
        .find('.stop-station__item__name-area__name__link__ja')
        .text()
        .replace('(', '（')
        .replace(')', '）');
    const translation = $(el).data('name').replace('(', ' (');

    if (!stops[stop_id]) {
        translations.push({
            table_name: 'stops',
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

        const stationList2 = route_id === '00000182'
            ? await fetch(`https://japantravel.navitime.com/en/area/jp/railroad/00000928/`)
                .then(res => res.text())
            : null;

        const $1 = load(stationList);
        const $2 = stationList2 && load(stationList2);

        const stopIds = $1('.stop-station__item')
            .toArray()
            .map(getStopIds.bind(null, $1, 0));

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

        if (route_id === '00000182') {
            const moreStopIds = $2('.stop-station__item')
                .toArray()
                .slice(4)
                .map(getStopIds.bind(null, $2, stopIds.length))

            const trains = await Promise.all(
                moreStopIds.map(async ([stopId]) => {
                    const page = await fetch(`https://www.navitime.co.jp/diagram/timetable?node=${stopId}&lineId=00000928`)
                        .then(res => res.text());
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

const findStopIdx = (routeId, stopId) => {
    const idx = stopIds[routeId][stopId];
    if (idx !== undefined) return [routeId, idx];

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
            return [route, stopsMap[stopId]];
    }
    
    return [];
}

// null; // 
const DEBUG = null; // '/diagram/stops/00000185/80a4005a/?node=00004689&year=2023&month=11&day=29&from=timetable';

for (const [service_id, direction_id, url] of allTrains) {
    if (DEBUG && url !== DEBUG) continue;

    const page = await fetch(`https://www.navitime.co.jp${url}`)
        .then(res => res.text());
    const $ = load(page);

    const route_id = url.split('/')[3] === '00000928' ? '00000182' : url.split('/')[3];
    const trip_id = `${url.split('/')[4]}_${service_id}`;

    const trip_headsign = $('.station-name-link').last().text();
    const trip_short_name = $('.head-txt').text();

    const shape_id = `${trip_id}_shp`;

    if ('0123456789'.includes(trip_short_name[3]))
        console.log(trip_short_name.padEnd(7, ' ') + '\u{3000}', service_id);
    else console.log(trip_short_name.padEnd(8, ' '), service_id);

    trips.push({
        trip_id,
        route_id,
        service_id,
        trip_headsign,
        trip_short_name,
        direction_id,
        shape_id
    })

    translations.push({
        table_name: 'trips',
        field_name: 'trip_headsign',
        language: 'en',
        translation: dictionary[trip_headsign],
        record_id: trip_id
    });

    if (!trip_short_name.match(/\d/))
        console.log(url)

    translations.push({
        table_name: 'trips',
        field_name: 'trip_short_name',
        language: 'en',
        translation: `${
            dictionary[trip_short_name.slice(0, trip_short_name.match(/\d/).index)]
        } ${
            trip_short_name.match(/\d+/)[0]
        }`,
        record_id: trip_id
    });

    const tripStopTimes = $('.stops').toArray().map((el, i) => {
        const time = $(el).find('.time').text();
        const fromToTime = $(el).find('.from-to-time').text();
        return {
            trip_id,
            arrival_time: (time.length ? time.slice(0, -1) : fromToTime.slice(0, 5)) + ':00',
            departure_time: (time.length ? time.slice(0, -1) : fromToTime.slice(6, 11)) + ':00',
            stop_id: $(el).find('.station-name-link').attr('href').split('=')[1],
            stop_sequence: i,
            timepoint: 1
        };
    });

    stop_times.push(...tripStopTimes);

    const [startRoute, firstStopIdx] = findStopIdx(route_id, tripStopTimes[0].stop_id);
    const [endRoute, lastStopIdx] = findStopIdx(route_id, tripStopTimes[tripStopTimes.length - 1].stop_id);

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

    // console.log(lastStopIdx, segments[endRoute].length, stopIds[endRoute])

    if (!direction_id) {
        startSegments.reverse();
        endSegments.reverse();
    }
    
    const tripSegments = startSegments.concat(endSegments);

    const tripShape = tripSegments
        .map((segment, i) => ({
            shape_id,
            shape_pt_lat: segment[1],
            shape_pt_lon: segment[0],
            shape_pt_sequence: i
        }));

    if (!tripShape.length)
        process.exit(1);
        
    shapes.push(...tripShape);

    if (DEBUG)
        break;
}

if (DEBUG) {
    const collection = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: shapes.map(shapePt => [
                        parseFloat(shapePt.shape_pt_lon), 
                        parseFloat(shapePt.shape_pt_lat)
                    ])
                },
                properties: trips[0],
                id: 0
            }
        ]
    };
    
    await writeFile('output.geojson', JSON.stringify(collection))
} else {
    await rm('./gtfs', { recursive: true, force: true });
    await mkdir('./gtfs', { recursive: true });
    
    const writeGTFSFile = async (name, arr) => {
        const header = Object.keys(arr[0]).join(',');
        const lines = [header, ...arr.map(obj => Object.values(obj).join(','))].join('\n');
        return writeFile(`./gtfs/${name}.txt`, lines);
    }
    
    Object.entries({
        agency, routes, calendar, trips, stop_times, stops: Object.values(stops), shapes, translations, feed_info
    }).map(pair => writeGTFSFile(...pair));
    
    console.log(agency.length, 'agency');
    console.log(routes.length, 'routes');
    console.log(calendar.length, 'calendar');
    console.log(Object.keys(stops).length, 'stops');
    console.log(trips.length, 'trips');
    console.log(stop_times.length, 'stop_times');
    console.log(shapes.length, 'shapes');
    console.log(translations.length, 'translations');
}
