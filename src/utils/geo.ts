import { WorldPreset } from '../types/map';

/**
 * Calculates Great-Circle distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km: number): { km: string; miles: string } {
  const miles = km * 0.621371;
  if (km < 1) {
    const meters = Math.round(km * 1000);
    const feet = Math.round(miles * 5280);
    return {
      km: `${meters} m`,
      miles: `${feet} ft`,
    };
  }
  return {
    km: `${km.toFixed(1)} km`,
    miles: `${miles.toFixed(1)} mi`,
  };
}

/**
 * Converts decimal degrees to DMS format (e.g., 40° 42' 46" N)
 */
export function toDMS(coordinate: number, isLatitude: boolean): string {
  const absolute = Math.abs(coordinate);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

  const direction = isLatitude
    ? coordinate >= 0
      ? 'N'
      : 'S'
    : coordinate >= 0
    ? 'E'
    : 'W';

  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

/**
 * World preset regions & metropolitan capitals for quick navigation
 */
export const WORLD_PRESETS: WorldPreset[] = [
  { id: 'world', name: 'Global Overview', region: 'World', lat: 20, lng: 0, zoom: 2 },
  { id: 'london', name: 'London', region: 'Europe', lat: 51.5074, lng: -0.1278, zoom: 12 },
  { id: 'newyork', name: 'New York City', region: 'North America', lat: 40.7128, lng: -74.006, zoom: 12 },
  { id: 'tokyo', name: 'Tokyo', region: 'Asia', lat: 35.6762, lng: 139.6503, zoom: 12 },
  { id: 'paris', name: 'Paris', region: 'Europe', lat: 48.8566, lng: 2.3522, zoom: 12 },
  { id: 'sydney', name: 'Sydney', region: 'Oceania', lat: -33.8688, lng: 151.2093, zoom: 12 },
  { id: 'cairo', name: 'Cairo', region: 'Africa', lat: 30.0444, lng: 31.2357, zoom: 12 },
  { id: 'riodejaneiro', name: 'Rio de Janeiro', region: 'South America', lat: -22.9068, lng: -43.1729, zoom: 12 },
  { id: 'reykjavik', name: 'Reykjavik', region: 'Europe (Nordic)', lat: 64.1466, lng: -21.9426, zoom: 12 },
  { id: 'dubai', name: 'Dubai', region: 'Middle East', lat: 25.2048, lng: 55.2708, zoom: 12 },
  { id: 'singapore', name: 'Singapore', region: 'Asia', lat: 1.3521, lng: 103.8198, zoom: 12 },
];

/**
 * Reverse geocode latitude and longitude to get human-friendly address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  displayName?: string;
} | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
        },
      }
    );
    clearTimeout(timeout);

    if (!response.ok) return null;
    const data = await response.json();
    const address = data.address || {};

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.hamlet;

    return {
      city,
      state: address.state,
      country: address.country,
      countryCode: address.country_code?.toUpperCase(),
      displayName: data.display_name,
    };
  } catch (err) {
    console.debug('Reverse geocoding unavailable or timed out', err);
    return null;
  }
}
