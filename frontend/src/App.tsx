import { useEffect, useMemo, useRef, useState } from 'react';
import './App.scss';
import { GetStopsPayload, GetTripInfoPayload, GetTripsByStopsPayload, Stop } from '../../src/types';
import { QueryFunctionContext, useQuery } from 'react-query';
import { MapboxOverlay, MapboxOverlayProps } from '@deck.gl/mapbox/typed';
import Map, { useControl, NavigationControl, MapRef } from 'react-map-gl';
import { GeoJsonLayer } from '@deck.gl/layers/typed';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Feature, Point } from 'geojson';
import type { PickingInfo } from '@deck.gl/core/typed';
import MapboxLanguage from '@mapbox/mapbox-gl-language';
import { Style } from 'mapbox-gl';

function DeckGLOverlay(props: MapboxOverlayProps & {
    interleaved?: boolean;
}) {
    const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
    overlay.setProps(props);
    return null;
}

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
    { queryKey: [_, tripId, startStopSeq, endStopSeq] }: QueryFunctionContext<string[]>
): Promise<GetTripInfoPayload | null> => {
    if (!tripId.length)
        return null;
    const params = new URLSearchParams({ startStopSeq, endStopSeq })
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

type StopFeature = Feature<Point, Stop>;

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
    const [showStops, setShowStops] = useState(true);
    const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
    const selectedTrip = useMemo(() => trips?.tripsWithTimesMap[trip], [trips, trip]);
    const { data: tripInfo } = useQuery(['tripInfo', trip, ...(selectedTrip?.stopSequences.split(',') ?? [])], getTripInfo);

    const tripsWithTimes = trips && Object.values(trips.tripsWithTimesMap);

    useEffect(() => {
        if (!mapRef.current) return;
        const language = new MapboxLanguage();
        setMapStyle(language.setLanguage(mapRef.current.getStyle(), lang));
    }, [lang]);

    useEffect(() => {
        setTrip('');
    }, [trips]);

    useEffect(() => {
        if (!tripInfo) return;
        
        setShowStops(false);

    }, [tripInfo])

    if (!stopsPayload) return null;
    const { stopsMap, geojson } = stopsPayload;
    const stops = Object.values(stopsMap);

    const onClick = (pickingInfo: PickingInfo) =>
        setSelectedStop(pickingInfo.object.properties);

    const stopsLayer = new GeoJsonLayer({
        id: 'stops-layer',
        data: geojson,
        pickable: true,
        onClick,
        pointType: 'circle+text',
        stroked: false,
        // @ts-ignore
        getFillColor: (d: StopFeature) => d.id === selectedStop?.id ? [100, 100, 100] : [0, 0, 0],
        getPointRadius: 8,
        pointRadiusUnits: 'pixels',
        updateTriggers: {
            getText: lang,
            getFillColor: selectedStop
        },
        textCharacterSet: 'auto',
        getTextSize: 16,
        getTextPixelOffset: [0, 20],
        textFontFamily: 'Trebuchet MS',
        visible: showStops,
        getText: (d: StopFeature) => 
            lang === 'en' 
                ? d.properties.nameEn 
                : d.properties.name
    });

    const tripLayer = new GeoJsonLayer({
        id: 'trip-layer',
        data: tripInfo?.geojson,
        pickable: true,
        // onClick,
        pointType: 'circle+text',
        stroked: false,
        // @ts-ignore
        // getFillColor: (d: StopFeature) => d.id === selectedStop?.id ? [100, 100, 100] : [0, 0, 0],
        getPointRadius: 8,
        pointRadiusUnits: 'pixels',
        updateTriggers: {
            getText: lang,
            getFillColor: selectedStop
        },
        textCharacterSet: 'auto',
        getTextSize: 16,
        getTextPixelOffset: [0, 20],
        textFontFamily: 'Trebuchet MS',
        visible: !showStops,
        getText: (d: StopFeature) => 
            lang === 'en' 
                ? d.properties.nameEn 
                : d.properties.name
    });

    return (
        <div className="app">
            <div className='info-panel'>
                <select value={lang} onChange={e => setLang(e.target.value)}>
                    <option value='en'>English</option>
                    <option value='ja'>Japanese</option>
                </select>
                <select value={service} onChange={e => setService(e.target.value)}>
                    <option value='weekday'>Weekdays</option>
                    <option value='saturday'>Saturdays</option>
                    <option value='holiday'>Sundays and Holidays</option>
                </select>
                <select value={startStop} onChange={e => setStartStop(e.target.value)}>
                <option value='' disabled>Start Stop</option>
                    {
                        stops.map(stop => {
                            return (
                                <option key={`start_${stop.id}`} value={stop.id}>
                                    {
                                        lang === 'en' 
                                            ? stop.nameEn 
                                            : stop.name
                                    }
                                </option>
                            );
                        })
                    }
                </select>
                <select value={endStop} onChange={e => setEndStop(e.target.value)}>
                    <option value='' disabled>End Stop</option>
                    {
                        stops.map(stop => {
                            return (
                                <option key={`end_${stop.id}`} value={stop.id}>
                                    {
                                        lang === 'en' 
                                            ? stop.nameEn 
                                            : stop.name
                                    }
                                </option>
                            );
                        })
                    }
                </select>
                {
                    tripsWithTimes && !tripsWithTimes.length &&
                    <p>No trips found!</p>
                }
                {
                    tripsWithTimes && !!tripsWithTimes.length &&
                    <select value={trip} onChange={e => setTrip(e.target.value)}>
                        <option value='' disabled />
                        {
                            tripsWithTimes.map(trip => {
                                return (
                                    <option key={trip.id} value={trip.id}>
                                    {
                                        trip.departureTimes.split(',')[0]
                                    } → {
                                        trip.arrivalTimes.split(',')[1]
                                    } ({getElapsedTime(
                                        parseInt(trip.departureTimestamps.split(',')[0]), 
                                        parseInt(trip.arrivalTimestamps.split(',')[1])
                                    )} hours) [{
                                        lang === 'en' 
                                            ? trip.shortNameEn
                                            : trip.shortName
                                    }]
                                    </option>
                                )
                            })
                        }
                    </select>
                }
                {
                    selectedStop &&
                    <div className='selected-stop'>
                        {
                            lang === 'en' 
                                ? selectedStop.nameEn
                                : selectedStop.name
                        }
                        <button onClick={() => {
                            setStartStop(selectedStop.id);
                        }}>Start here</button>
                        <button onClick={() => {
                            setEndStop(selectedStop.id)
                        }}>End here</button>
                    </div>
                }
            </div>
            <div className='map'>
                <Map
                    initialViewState={{
                        bounds: [128.316220, 29.508335, 147.753738, 46.261185]
                    }}
                    ref={mapRef}
                    hash={true}
                    mapStyle={mapStyle ?? 'mapbox://styles/mapbox/streets-v11'}
                >
                    <DeckGLOverlay layers={[stopsLayer, tripLayer]} />
                    <NavigationControl />
                </Map>
            </div>
        </div>
    );
}
    

export default App;
