import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { UserLocation, TileLayerConfig } from '../types/map';
import { calculateDistanceKm, formatDistance, toDMS } from '../utils/geo';

interface WorldMapProps {
  userLocation: UserLocation | null;
  activeLayer: TileLayerConfig;
  targetLocation: { lat: number; lng: number; title?: string } | null;
  onMapClick?: (lat: number, lng: number) => void;
  onMouseMove?: (lat: number, lng: number) => void;
  isMeasureMode?: boolean;
  selectedMeasurePoint: { lat: number; lng: number } | null;
  onClearMeasure?: () => void;
  onMapReady?: (map: L.Map) => void;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  userLocation,
  activeLayer,
  targetLocation,
  onMapClick,
  onMouseMove,
  isMeasureMode,
  selectedMeasurePoint,
  onClearMeasure,
  onMapReady,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const measureLineRef = useRef<L.Polyline | null>(null);
  const measureMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default to global overview
    const map = L.map(mapContainerRef.current, {
      center: [22, 10],
      zoom: 2.5,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
    });

    // Initial tile layer
    const tileLayer = L.tileLayer(activeLayer.url, {
      attribution: activeLayer.attribution,
      maxZoom: activeLayer.maxZoom,
      subdomains: activeLayer.subdomains || 'abc',
    }).addTo(map);

    currentTileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;
    onMapReady?.(map);

    // Track mouse coordinates for live HUD
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      onMouseMove?.(e.latlng.lat, e.latlng.lng);
    });

    // Map click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    });

    // Invalidate size after mounting to handle any container animation
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when changed
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(activeLayer.url, {
      attribution: activeLayer.attribution,
      maxZoom: activeLayer.maxZoom,
      subdomains: activeLayer.subdomains || 'abc',
    }).addTo(map);

    currentTileLayerRef.current = newTileLayer;
  }, [activeLayer]);

  // Handle Fly-To target location changes (from presets or search)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !targetLocation) return;

    map.flyTo([targetLocation.lat, targetLocation.lng], 13, {
      duration: 1.8,
      easeLinearity: 0.25,
    });
  }, [targetLocation]);

  // Update User Location Marker & Accuracy Radius
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!userLocation) {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (userAccuracyCircleRef.current) {
        map.removeLayer(userAccuracyCircleRef.current);
        userAccuracyCircleRef.current = null;
      }
      return;
    }

    const { lat, lng, accuracy, address } = userLocation;
    const latLng = L.latLng(lat, lng);

    // Create high-tech custom radar marker HTML
    const markerHtml = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group pointer-events-auto">
        <!-- Radar Pulse Rings -->
        <div class="absolute w-12 h-12 rounded-full bg-cyan-400/30 user-radar-ring pointer-events-none"></div>
        <div class="absolute w-12 h-12 rounded-full bg-cyan-400/25 user-radar-ring-delayed pointer-events-none"></div>
        
        <!-- Outer Glowing Ring -->
        <div class="w-7 h-7 rounded-full bg-cyan-950/80 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.8)] transition-transform group-hover:scale-110">
          <!-- Inner Core Dot -->
          <div class="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
        </div>

        <!-- Optional compass indicator if heading exists -->
        ${
          userLocation.heading !== null
            ? `<div class="absolute -top-1 w-1.5 h-1.5 bg-white rounded-full shadow-sm" style="transform: rotate(${userLocation.heading}deg) translateY(-8px);"></div>`
            : ''
        }
      </div>
    `;

    const customIcon = L.divIcon({
      html: markerHtml,
      className: 'user-location-marker-container',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const locationName =
      address?.city
        ? `${address.city}${address.country ? ', ' + address.country : ''}`
        : 'Your Current Location';

    const popupHtml = `
      <div class="p-2 min-w-[220px]">
        <div class="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-700/60">
          <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span class="font-bold text-xs uppercase tracking-wider text-cyan-400">Live User Location</span>
        </div>
        <p class="font-semibold text-sm text-slate-100 mb-1">${locationName}</p>
        <div class="space-y-1 text-xs text-slate-300 font-mono">
          <div class="flex justify-between">
            <span class="text-slate-400">Lat:</span>
            <span>${lat.toFixed(6)}°</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Lng:</span>
            <span>${lng.toFixed(6)}°</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Accuracy:</span>
            <span class="text-emerald-400">±${Math.round(accuracy)} m</span>
          </div>
          ${
            userLocation.altitude !== null
              ? `<div class="flex justify-between"><span class="text-slate-400">Altitude:</span><span>${Math.round(
                  userLocation.altitude
                )} m</span></div>`
              : ''
          }
        </div>
        <div class="mt-2.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
          <span>Updated just now</span>
          <span class="text-cyan-400">${toDMS(lat, true)}</span>
        </div>
      </div>
    `;

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(latLng, { icon: customIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(popupHtml);
    } else {
      userMarkerRef.current.setLatLng(latLng);
      userMarkerRef.current.setIcon(customIcon);
      userMarkerRef.current.setPopupContent(popupHtml);
    }

    // Accuracy Circle
    if (!userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current = L.circle(latLng, {
        radius: Math.max(accuracy, 15),
        color: '#06b6d4',
        weight: 1.5,
        opacity: 0.7,
        fillColor: '#06b6d4',
        fillOpacity: 0.12,
        dashArray: '4, 6',
      }).addTo(map);
    } else {
      userAccuracyCircleRef.current.setLatLng(latLng);
      userAccuracyCircleRef.current.setRadius(Math.max(accuracy, 15));
    }
  }, [userLocation]);

  // Handle Measurement Geodesic Line and Target Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!selectedMeasurePoint || !userLocation) {
      if (measureLineRef.current) {
        map.removeLayer(measureLineRef.current);
        measureLineRef.current = null;
      }
      if (measureMarkerRef.current) {
        map.removeLayer(measureMarkerRef.current);
        measureMarkerRef.current = null;
      }
      return;
    }

    const userLatLng = L.latLng(userLocation.lat, userLocation.lng);
    const targetLatLng = L.latLng(selectedMeasurePoint.lat, selectedMeasurePoint.lng);

    const distKm = calculateDistanceKm(
      userLocation.lat,
      userLocation.lng,
      selectedMeasurePoint.lat,
      selectedMeasurePoint.lng
    );
    const distFormatted = formatDistance(distKm);

    // Draw geodesic line
    if (!measureLineRef.current) {
      measureLineRef.current = L.polyline([userLatLng, targetLatLng], {
        color: '#f59e0b',
        weight: 3,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);
    } else {
      measureLineRef.current.setLatLngs([userLatLng, targetLatLng]);
    }

    // Target marker
    const targetIconHtml = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
        <div class="w-6 h-6 rounded-full bg-amber-500/20 animate-ping"></div>
        <div class="absolute w-5 h-5 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center shadow-lg">
          <div class="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
        </div>
      </div>
    `;

    const targetIcon = L.divIcon({
      html: targetIconHtml,
      className: 'target-measure-marker',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const measurePopupHtml = `
      <div class="p-2 min-w-[200px]">
        <div class="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase mb-1">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2v20"></path>
          </svg>
          Direct Distance
        </div>
        <div class="text-xl font-bold text-slate-100 font-mono my-1">
          ${distFormatted.km}
        </div>
        <div class="text-xs text-slate-400 font-mono mb-2">
          (${distFormatted.miles})
        </div>
        <div class="text-[11px] text-slate-300 space-y-0.5 border-t border-slate-700/60 pt-1.5">
          <div class="flex justify-between">
            <span class="text-slate-400">Target Lat:</span>
            <span>${selectedMeasurePoint.lat.toFixed(4)}°</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Target Lng:</span>
            <span>${selectedMeasurePoint.lng.toFixed(4)}°</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Est. Flight:</span>
            <span class="text-cyan-300">~${Math.round((distKm / 850) * 10) / 10} hrs</span>
          </div>
        </div>
      </div>
    `;

    if (!measureMarkerRef.current) {
      measureMarkerRef.current = L.marker(targetLatLng, { icon: targetIcon })
        .addTo(map)
        .bindPopup(measurePopupHtml)
        .openPopup();
    } else {
      measureMarkerRef.current.setLatLng(targetLatLng);
      measureMarkerRef.current.setIcon(targetIcon);
      measureMarkerRef.current.setPopupContent(measurePopupHtml);
    }
  }, [selectedMeasurePoint, userLocation]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Crosshair cursor indicator when measure mode is on */}
      {isMeasureMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-amber-500/90 backdrop-blur-md text-slate-950 font-semibold px-4 py-1.5 rounded-full shadow-lg text-xs flex items-center gap-2 animate-bounce">
            <span className="w-2 h-2 rounded-full bg-slate-950"></span>
            Click anywhere on the world map to measure distance from your location
          </div>
        </div>
      )}
    </div>
  );
};
