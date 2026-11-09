export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number; // in meters
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
  address?: {
    city?: string;
    state?: string;
    country?: string;
    countryCode?: string;
    displayName?: string;
  };
}

export type GeolocationStatus =
  | 'idle'
  | 'prompt'
  | 'requesting'
  | 'success'
  | 'error'
  | 'watch_active'
  | 'simulated';

export interface TileLayerConfig {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
  thumbnail: string;
  category: 'satellite' | 'streets' | 'dark' | 'light' | 'terrain';
}

export interface WorldPreset {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  zoom: number;
}
