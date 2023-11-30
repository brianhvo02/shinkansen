import { useEffect, useMemo, useRef, useState } from 'react';
import './App.scss';
import { GetStopsPayload, GetTripInfoPayload, GetTripsByStopsPayload, Stop } from '../../src/types';
import { QueryFunctionContext, useQuery } from 'react-query';
import Map, { NavigationControl, MapRef, Source, Layer, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import { LngLatBounds, Style } from 'mapbox-gl';
import { isStop } from './utils';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { Button, ButtonGroup, Dialog, DialogTitle, FormControl, InputLabel, MenuItem, Pagination, Select } from '@mui/material';

const getStops = async (): Promise<GetStopsPayload> => {
    const res = await fetch('/api/stops');
    if (!res.ok) throw new Error();
    return res.json();
}

const getTripsByStops = async (
    { queryKey: [_, service, startStopId, endStopId] }: QueryFunctionContext<string[]>
): Promise<GetTripsByStopsPayload | null> => {
    if (!startStopId.length || !endStopId.length)
        return null;
    const res = await fetch(`/api/trips/${service}/${startStopId}/${endStopId}`);
    if (!res.ok) throw new Error();
    return res.json();
}

const getTripInfo = async (
    { queryKey: [_, tripId, start, end] }: QueryFunctionContext<string[]>
): Promise<GetTripInfoPayload | null> => {
    if (!tripId.length)
        return null;
    const params = new URLSearchParams({ start, end })
    const res = await fetch(`/api/trips/info/${tripId}?${params}`);
    if (!res.ok) throw new Error();
    return res.json();
}

const getElapsedTime = (a: number, b: number) => {
    const minutes = (b - a) / 60;
    const hours = minutes / 60;

    return [
        Math.floor(hours).toString().padStart(2, '0'), 
        (minutes % 60).toString().padStart(2, '0')
    ].join(':');
}

const App = () => {
    const { data: stopsPayload } = useQuery('stops', getStops);
    const [lang, setLang] = useState('en');
    const [service, setService] = useState('weekday');
    const [startStop, setStartStop] = useState('');
    const [endStop, setEndStop] = useState('');
    const { data: trips } = useQuery(['trips', service, startStop, endStop], getTripsByStops);
    const [trip, setTrip] = useState('');
    const mapRef = useRef<MapRef>(null);
    const [mapStyle, setMapStyle] = useState<Style>();
    const [selectedStop, setSelectedStop] = useState<Stop | null>();

    const selectedTrip = useMemo(() => trips?.tripsWithTimesMap[trip], [trips, trip]);
    const { departTime, arriveTime, elapsedTime } = useMemo(() => {
        const departTime = selectedTrip?.departureTimes.split(',')[0];
        const arriveTime = selectedTrip?.arrivalTimes.split(',')[1];
        const departTs = selectedTrip?.departureTimestamps.split(',')[0];
        const arriveTs = selectedTrip?.arrivalTimestamps.split(',')[1];
        const elapsedTime = departTs && arriveTs && getElapsedTime(
            parseInt(departTs), 
            parseInt(arriveTs)
        );

        return { departTime, arriveTime, elapsedTime };
    }, [selectedTrip])

    const { data: tripInfo } = useQuery(['tripInfo', trip, ...(selectedTrip?.stopSequences.split(',') ?? [])], getTripInfo);
    
    const [showStopList, setShowStopList] = useState(false);
    const [stopList, setStopList] = useState<'start' | 'end'>('start');
    const [stopListPage, setStopListPage] = useState(1);

    const [showTripList, setShowTripList] = useState(false);
    const [tripListPage, setTripListPage] = useState(1);

    const popupRef = useRef<mapboxgl.Popup>(null);

    const tripsWithTimes = trips && Object.values(trips.tripsWithTimesMap);

    useEffect(() => {
        if (!mapRef.current) return;
        const language = new MapboxLanguage();
        setMapStyle(language.setLanguage(mapRef.current.getStyle(), lang));
    }, [lang]);

    useEffect(() => {
        if (trip) setSelectedStop(null);
    }, [trip]);

    useEffect(() => {
        if (tripInfo && mapRef.current) {
            const bounds = new LngLatBounds();
            tripInfo.geojson.features.forEach(({ geometry }) => {
                if (geometry.type === 'Point') {
                    bounds.extend({ 
                        lon: geometry.coordinates[0], 
                        lat: geometry.coordinates[1] 
                    });
                }
            });
            mapRef.current.fitBounds(bounds, { padding: 50 });
        }
    }, [tripInfo]);

    useEffect(() => {
        setTrip('');
    }, [trips]);

    useEffect(() => {
        // if (selectedStop)
            // popupRef.current?.to
    }, [selectedStop])

    if (!stopsPayload) return null;
    const stops = Object.values(stopsPayload.stopsMap);

    const handleSelectStop = (type: 'start' | 'end') => () => {
        setStopList(type);
        setShowStopList(true);
    }

    return (
        <div className='app'>
            <div className='info-panel'>
                <header>
                    <FormControlLabel 
                        control={
                            <Switch 
                                checked={lang === 'ja'} 
                                onChange={() => setLang(prev => prev === 'en' ? 'ja' : 'en')} 
                            />
                        } 
                        label={lang === 'en' ? 'English' : '日本語'} 
                    />
                    <Button 
                        variant='text'
                        onClick={() => {
                            setStartStop('');
                            setEndStop('');
                            setTrip('');
                            setSelectedStop(null);
                            setStopListPage(1);
                            setTripListPage(1);
                        }}
                    >Start over</Button>
                </header>
                <h1>
                    <span>新幹線 - Shinkansen</span>
                    <span>Trip Planner</span>
                </h1>
                <FormControl fullWidth>
                    <InputLabel>Service</InputLabel>
                    <Select
                        value={service}
                        label='Service'
                        onChange={e => setService(e.target.value)}
                    >
                        <MenuItem value='weekday'>Weekdays</MenuItem>
                        <MenuItem value='saturday'>Saturdays</MenuItem>
                        <MenuItem value='holiday'>Sundays and Holidays</MenuItem>
                    </Select>
                </FormControl>
                <div className='start-end-stops'>
                    <div className='start-end-stop' onClick={handleSelectStop('start')}>
                        <h2>Start Stop</h2>
                        {
                            startStop.length ? (
                                <>
                                    <p>{stopsPayload.stopsMap[startStop].name}</p>
                                    <p>{stopsPayload.stopsMap[startStop].nameEn}</p>
                                </>
                            ) : (
                                <>
                                    <p><br /></p>
                                    <p>Select</p>
                                </>
                            )
                        }
                    </div>
                    <div className='start-end-stop' onClick={handleSelectStop('end')}>
                        <h2>End Stop</h2>
                        {
                            endStop.length ? (
                                <>
                                    <p>{stopsPayload.stopsMap[endStop].name}</p>
                                    <p>{stopsPayload.stopsMap[endStop].nameEn}</p>
                                </>
                            ) : (
                                <>
                                    <p><br /></p>
                                    <p>Select</p>
                                </>
                            )
                        }
                    </div>
                </div>
                <Dialog 
                    onClose={() => setShowStopList(false)} 
                    open={showStopList}
                >
                    <div className='stop-list'>
                        <DialogTitle>Select {stopList} stop</DialogTitle>
                        <ul className='stops'>
                        {
                            stops.slice((stopListPage - 1) * 21, stopListPage * 21).map(stop => {
                                return (
                                    <li 
                                        key={stop.id}
                                        onClick={() => {
                                            (stopList === 'start'
                                                ? setStartStop
                                                : setEndStop
                                            )(stop.id);
                                            setShowStopList(false);
                                        }}
                                    >
                                        <h2>{stop.name}</h2>
                                        <h2>{stop.nameEn}</h2>
                                    </li>
                                );
                            })
                        }
                        </ul>
                        <Pagination
                            count={Math.ceil(stops.length / 21)}
                            page={stopListPage} 
                            onChange={(_, val) => setStopListPage(val)}
                        />
                    </div>
                </Dialog>
                {
                    tripsWithTimes &&
                    <Dialog 
                        onClose={() => setShowTripList(false)} 
                        open={showTripList}
                    >
                        <div className='trip-list'>
                            <DialogTitle>Select train</DialogTitle>
                            <ul className='trips'>
                            {
                                tripsWithTimes.slice((tripListPage - 1) * 12, tripListPage * 12)
                                    .map(trip => {
                                        const departTime = trip.departureTimes.split(',')[0];
                                        const arriveTime = trip.arrivalTimes.split(',')[1];
                                        const elapsedTime = getElapsedTime(
                                            parseInt(trip.departureTimestamps.split(',')[0]), 
                                            parseInt(trip.arrivalTimestamps.split(',')[1])
                                        );

                                        return (
                                            <li 
                                                key={trip.id}
                                                onClick={() => {
                                                    setTrip(trip.id);
                                                    setShowTripList(false);
                                                }}
                                            >
                                                <h1>{trip.shortName}</h1>
                                                <h1>{trip.shortNameEn}</h1>
                                                <h2>
                                                {
                                                    departTime.slice(0, departTime.lastIndexOf(':'))
                                                } → {
                                                    arriveTime.slice(0, arriveTime.lastIndexOf(':'))
                                                }
                                                </h2>
                                                <p>{elapsedTime} hours</p>
                                            </li>
                                        );
                                    })
                            }
                            </ul>
                            <Pagination
                                count={Math.ceil(tripsWithTimes.length / 12)}
                                page={tripListPage} 
                                onChange={(_, val) => setTripListPage(val)}
                            />
                        </div>
                    </Dialog>
                }
                {
                    tripsWithTimes && (
                        tripsWithTimes.length ? (
                            <Button 
                                variant='contained' 
                                onClick={() => setShowTripList(true)}
                            >Select train</Button>
                        ) : <p>No trips found!</p>
                    )
                }
                {
                    selectedTrip &&
                    <div className='selected-trip'>
                        <h2>{selectedTrip.shortName}</h2>
                        <h2>{selectedTrip.shortNameEn}</h2>
                        <p>
                        {
                            departTime?.slice(0, departTime.lastIndexOf(':'))
                        } → {
                            arriveTime?.slice(0, arriveTime.lastIndexOf(':'))
                        }
                        </p>
                        <p>{elapsedTime} hours</p>
                        <h3>Last Stop</h3>
                        <p>{selectedTrip.headsign}</p>
                        <p>{selectedTrip.headsignEn}</p>
                    </div>
                }
                <footer>
                    <p>Copyright &#169; 2023 Brian Vo</p>
                    <div className='links'>
                        <a href='https://brianhuyvo.com' target='_blank' rel="noreferrer">
                            Website
                        </a>
                        <a href='https://github.com/brianhvo02' target='_blank' rel="noreferrer">
                            GitHub
                        </a>
                    </div>
                </footer>
            </div>
            <div className='map'>
                <Map
                    initialViewState={{
                        bounds: [128.316220, 29.508335, 147.753738, 46.261185]
                    }}
                    ref={mapRef}
                    hash
                    reuseMaps
                    mapStyle={mapStyle ?? 'mapbox://styles/mapbox/streets-v12'}
                    terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
                    interactiveLayerIds={['stops']}
                    onClick={
                        e => isStop(e.features?.[0]?.properties) 
                            && setSelectedStop(e.features?.[0]?.properties)
                    }
                >
                    <Source
                        id='mapbox-dem'
                        type='raster-dem'
                        url='mapbox://mapbox.mapbox-terrain-dem-v1'
                        tileSize={512}
                        maxzoom={14}
                    />
                    <Source type='geojson' data={tripInfo?.geojson ?? stopsPayload.geojson}>
                        <Layer
                            id='stops'
                            type='symbol'
                            paint={{ 'text-color': '#000000' }}
                            layout={{
                                'icon-image': 'rail',
                                'icon-size': 1.5,
                                'text-field': {
                                    type: 'identity',
                                    property: lang === 'en' ? 'nameEn' : 'name'
                                },
                                'text-anchor': 'top',
                                'text-offset': [0, 0.75]
                            }}
                        />
                        <Layer 
                            id='routes' 
                            type='line' 
                            paint={{
                                'line-width': 4,
                                'line-color': '#4A89F3'
                            }}
                        />
                    </Source>
                    <NavigationControl />
                    {
                        selectedStop &&
                        <Popup 
                            key={selectedStop.id} 
                            longitude={selectedStop.lon} 
                            latitude={selectedStop.lat} 
                            ref={popupRef}
                            onClose={() => setSelectedStop(null)}
                            className='selected-stop'
                        >
                            <h2>{selectedStop.name}</h2>
                            <h2>{selectedStop.nameEn}</h2>
                            <ButtonGroup variant="text">
                                <Button 
                                    onClick={() => {
                                        setStartStop(selectedStop.id);
                                        popupRef.current?.remove();
                                    }}
                                >Set start</Button>
                                <Button 
                                    onClick={() => {
                                        setEndStop(selectedStop.id);
                                        popupRef.current?.remove();
                                    }}
                                >Set end</Button>
                            </ButtonGroup>
                        </Popup>
                    }
                </Map>
            </div>
        </div>
    );
}
    

export default App;
