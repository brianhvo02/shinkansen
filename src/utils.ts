import { Position } from 'geojson';

const toRadian = (angle: number) => (Math.PI / 180) * angle;
const distance = (a: number, b: number) => (Math.PI / 180) * (a - b);
const RADIUS_OF_EARTH_IN_KM = 6371;

export const haversineDistance = ([lon1, lat1]: Position, [lon2, lat2]: Position, isMiles = false) => {
    const dLat = distance(lat2, lat1);
    const dLon = distance(lon2, lon1);

    lat1 = toRadian(lat1);
    lat2 = toRadian(lat2);

    const a =
      Math.pow(Math.sin(dLat / 2), 2) +
      Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.asin(Math.sqrt(a));

    return isMiles 
        ? RADIUS_OF_EARTH_IN_KM * c
        : RADIUS_OF_EARTH_IN_KM * c / 1.60934;
};