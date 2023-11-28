import { readFile, writeFile } from 'fs/promises';
import _ from 'lodash';
import { createServer } from 'node:http';

const dictionary = Object.fromEntries(
    Object.entries({
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
    }).map(entry => entry.reverse())
);

const readCsv = async file => {
    const csv = await readFile(`./gtfs/${file}.txt`, 'utf-8');
    const [headers, ...lines] = csv.split('\n');
    return lines.map(line => _.zipObject(headers.split(','), line.split(',')));
}

const shapes = await readCsv('shapes');
const trips = await readCsv('trips');
const stopTimes = await readCsv('stop_times');
const stops = await readCsv('stops');
const translations = await readCsv('translations');

const server = createServer((req, res) => {
    const [name, number] = req.url.slice(req.url.lastIndexOf('/') + 1).split('%20');
    const train = dictionary[name] + number + '号';
    console.log(train);

    const trip = trips.find(trip => trip.trip_short_name === train && trip.service_id === 'weekday');
    const trip_headsign = translations.find(({ field_name, record_id }) => field_name === 'trip_headsign' && record_id === trip.trip_id).translation;
    const trip_short_name = translations.find(({ field_name, record_id }) => field_name === 'trip_short_name' && record_id === trip.trip_id).translation;

    const shape = shapes
        .filter(datum => datum.shape_id === trip.shape_id)
        .sort((a, b) => parseInt(a.shape_pt_sequence) - parseInt(b.shape_pt_sequence));

    const times = stopTimes
        .filter(({ trip_id }) => trip_id === trip.trip_id)
        .sort((a, b) => parseInt(a.stop_sequence) - parseInt(b.stop_sequence))
        .map((stopTime, i) => {
            const stop = stops.find(({ stop_id }) => stop_id === stopTime.stop_id);
            const stop_name = translations.find(({ field_name, record_id }) => field_name === 'stop_name' && record_id === stop.stop_id).translation;
            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [
                        parseFloat(stop.stop_lon),
                        parseFloat(stop.stop_lat)
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

    const collection = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: shape.map(shapePt => [
                        parseFloat(shapePt.shape_pt_lon), 
                        parseFloat(shapePt.shape_pt_lat)
                    ])
                },
                properties: {
                    ...trip,
                    trip_headsign,
                    trip_short_name
                },
                id: 0
            },
            ...times
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