import { GeoJsonProperties } from 'geojson';
import _ from 'lodash';
import { Stop } from '../../src/types';

const STOP_KEYS = ['id', 'lat', 'lon', 'name', 'nameEn'];
const STOP_TYPES = ['string', 'number', 'number', 'string', 'string'];
export const isStop = (properties?: GeoJsonProperties): properties is Stop =>
    !!properties && _.isEqual(Object.keys(properties).sort(), STOP_KEYS)
        && _.isEqual(
            _.sortBy(Object.entries(properties), '0')
                .map(([, property]) => typeof property), 
            STOP_TYPES
        );