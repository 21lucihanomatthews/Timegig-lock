/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { WorldMap } from './components/WorldMap';
import { TopSearchBar } from './components/TopSearchBar';
import { MapControls } from './components/MapControls';
import { BottomNavBar } from './components/BottomNavBar';
import { FeatureView } from './components/FeatureView';
import { SubscriptionModal } from './components/SubscriptionModal';
import { UserLocation, GeolocationStatus, TileLayerConfig } from './types/map';
import { MAP_LAYERS } from './data/layers';
import { reverseGeocode } from './utils/geo';
import { ShieldAlert } from 'lucide-react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const watchIdRef = useRef<number | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const [activeLayer, setActiveLayer] = useState<TileLayerConfig>(MAP_LAYERS[0]); // OpenStreetMap
  const [targetLocation, setTargetLocation] = useState<{ lat: number; lng: number; title?: string } | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [selectedMeasurePoint, setSelectedMeasurePoint] = useState<{ lat: number; lng: number } | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('none');

  // Sound Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Fallback notification for iframe permission blocks
  const [permissionErrorBanner, setPermissionErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    // Splash screen timer
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);

    // Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        setUserEmail(user.email || '');

        // Fetch user status from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const isMainAccount = user.email === 'timegig2026@gmail.com';
          setSubscriptionStatus(isMainAccount ? 'active' : (userData.subscriptionStatus || 'none'));
          
          if (!isMainAccount && userData.subscriptionStatus !== 'active') {
            setActiveTab('tenant');
          }
        }
      } else {
        setIsLoggedIn(false);
        setUserEmail('');
        setSubscriptionStatus('none');
      }
    });

    return () => {
      clearTimeout(splashTimer);
      unsubscribe();
    };
  }, []);

  /**
   * Sound effect generator
   */
  const playTabSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }, [soundEnabled]);

  /**
   * Request user's real browser geolocation
   */
  const requestUserLocation = useCallback((shouldFlyTo: boolean = true) => {
    if (!navigator.geolocation) {
      setStatus('error');
      setStatusMessage('HTML5 Geolocation is not supported by your browser.');
      setPermissionErrorBanner('Geolocation API is not available on this device.');
      return;
    }

    setStatus('requesting');
    setStatusMessage('Querying GPS satellites and network location...');
    setPermissionErrorBanner(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords;
        const newLocation: UserLocation = {
          lat: latitude,
          lng: longitude,
          accuracy,
          altitude,
          altitudeAccuracy,
          heading,
          speed,
          timestamp: position.timestamp,
        };

        setUserLocation(newLocation);
        setStatus('success');
        setStatusMessage(`GPS Fix acquired (Accuracy: ±${Math.round(accuracy)}m)`);

        if (shouldFlyTo) {
          setTargetLocation({ lat: latitude, lng: longitude, title: 'Your Location' });
        }

        const address = await reverseGeocode(latitude, longitude);
        if (address) {
          setUserLocation((prev) => (prev ? { ...prev, address } : null));
        }
      },
      (error) => {
        let msg = 'Unable to retrieve location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location permission was denied.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            msg = 'Location request timed out.';
            break;
        }
        setStatus('error');
        setStatusMessage(msg);
        setPermissionErrorBanner(msg);

        setUserLocation((current) => {
          if (!current) {
            return {
              lat: 51.5074,
              lng: -0.1278,
              accuracy: 25,
              altitude: 35,
              altitudeAccuracy: 10,
              heading: null,
              speed: null,
              timestamp: Date.now(),
              address: {
                city: 'London',
                country: 'United Kingdom',
                countryCode: 'GB',
                displayName: 'London, Greater London, England, United Kingdom',
              },
            };
          }
          return current;
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    requestUserLocation(false);
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [requestUserLocation]);

  const handleSimulateLocation = async (lat: number, lng: number, name?: string) => {
    setStatus('simulated');
    setStatusMessage(`Simulated location active: ${name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}`);
    setPermissionErrorBanner(null);

    const simLoc: UserLocation = {
      lat,
      lng,
      accuracy: 20,
      altitude: 45,
      altitudeAccuracy: 5,
      heading: 90,
      speed: 1.5,
      timestamp: Date.now(),
      address: {
        city: name,
        displayName: name,
      },
    };

    setUserLocation(simLoc);
    setTargetLocation({ lat, lng, title: name });

    const addr = await reverseGeocode(lat, lng);
    if (addr) {
      setUserLocation((prev) => (prev ? { ...prev, address: addr } : null));
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedMeasurePoint({ lat, lng });
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const isSatellite = activeLayer.id === 'esri-satellite';
  const handleToggleSatellite = () => {
    if (isSatellite) {
      const osm = MAP_LAYERS.find((l) => l.id === 'osm-standard') || MAP_LAYERS[0];
      setActiveLayer(osm);
    } else {
      const sat = MAP_LAYERS.find((l) => l.id === 'esri-satellite') || MAP_LAYERS[3];
      setActiveLayer(sat);
    }
  };

  const handleLocateUser = () => {
    if (userLocation) {
      setTargetLocation({ lat: userLocation.lat, lng: userLocation.lng, title: 'Your Location' });
    } else {
      requestUserLocation(true);
    }
  };

  const handleTabChange = (tab: string | null) => {
    playTabSound();
    
    // If trying to access features without being logged in, force auth tab
    if (tab && tab !== 'auth' && !isLoggedIn) {
      setActiveTab('auth');
      return;
    }

    // If logged in but not active, force them to stay in tenant or profile (for logout)
    if (isLoggedIn) {
      // Re-read status to be sure
      const users = JSON.parse(localStorage.getItem('timegig_users') || '[]');
      const user = users.find((u: any) => u.email === userEmail);
      const isMainAccount = userEmail === 'timegig2026@gmail.com';
      const status = isMainAccount ? 'active' : (user?.subscriptionStatus || 'none');
      
      if (status !== 'active') {
        // Only allow switching between 'tenant' and 'profile' (for logout/settings)
        if (tab === 'profile' || tab === 'tenant') {
           setActiveTab(tab);
        } else {
           setActiveTab('tenant');
        }
        return;
      }
    }
    
    setActiveTab(tab);
  };

  const handleAuthSuccess = (email: string, redirectTab: string | null) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    localStorage.setItem('timegig_session', email);

    // Initial check of status
    const users = JSON.parse(localStorage.getItem('timegig_users') || '[]');
    const user = users.find((u: any) => u.email === email);
    const isMainAccount = email === 'timegig2026@gmail.com';
    const status = isMainAccount ? 'active' : (user?.subscriptionStatus || 'none');
    setSubscriptionStatus(status);

    // If not active, always redirect to tenant regardless of the requested tab
    if (status !== 'active') {
      setActiveTab('tenant');
    } else {
      setActiveTab(redirectTab);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    setSubscriptionStatus('none');
    localStorage.removeItem('timegig_session');
    setActiveTab(null);
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center animate-fade-in">
        <h1 className="text-5xl font-black text-black tracking-[0.2em] uppercase transition-all scale-110">
          TimeGiG
        </h1>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 pb-[68px]">
      {/* Top Search Bar (Only shown when on map or in GiGs) */}
      {(activeTab === null || activeTab === 'gigs') && (
        <TopSearchBar
          onSelectLocation={(lat, lng, title) => {
            setTargetLocation({ lat, lng, title });
          }}
        />
      )}

      {/* Permission / Status Warning Banner */}
      {permissionErrorBanner && (activeTab === null) && (
        <div className="absolute top-20 right-4 md:w-96 z-25 pointer-events-auto">
          <div className="bg-amber-950/90 backdrop-blur-xl border border-amber-600/50 text-amber-200 text-xs p-3 rounded-2xl shadow-xl flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-100">Location Access Notice</p>
              <p className="text-[11px] text-amber-300/90 mt-0.5">{permissionErrorBanner}</p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => handleSimulateLocation(51.5074, -0.1278, 'London')}
                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[10px] font-semibold border border-amber-500/40 transition"
                >
                  Use London Demo
                </button>
                <button
                  onClick={() => handleSimulateLocation(40.7128, -74.006, 'New York')}
                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[10px] font-semibold border border-amber-500/40 transition"
                >
                  Use New York Demo
                </button>
                <button
                  onClick={() => setPermissionErrorBanner(null)}
                  className="ml-auto text-[10px] text-amber-400/80 hover:text-amber-200 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Map Background */}
      <div className={`w-full h-full transition-all duration-300 ${(activeTab !== null && activeTab !== 'gigs') ? 'filter blur-md scale-105 select-none' : ''}`}>
        <WorldMap
          userLocation={userLocation}
          activeLayer={activeLayer}
          targetLocation={targetLocation}
          onMapClick={handleMapClick}
          onMouseMove={(lat, lng) => setCursorCoords({ lat, lng })}
          isMeasureMode={false}
          selectedMeasurePoint={selectedMeasurePoint}
          onClearMeasure={() => setSelectedMeasurePoint(null)}
          onMapReady={(map) => {
            mapRef.current = map;
          }}
        />
      </div>

      {/* Feature Screens */}
      {activeTab !== null && (
        <FeatureView 
          activeTab={activeTab} 
          onClose={() => handleTabChange(null)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onAuthSuccess={handleAuthSuccess}
          onLogout={handleLogout}
          userEmail={userEmail}
          playTabSound={playTabSound}
          isLoggedIn={isLoggedIn}
        />
      )}

      {/* Map Controls */}
      {(activeTab === null || activeTab === 'gigs') && (
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onToggleSatellite={handleToggleSatellite}
          onLocateUser={handleLocateUser}
          isSatellite={isSatellite}
        />
      )}

      {/* Bottom Menu */}
      <BottomNavBar activeTab={activeTab || ''} onTabChange={handleTabChange} isLoggedIn={isLoggedIn} />

      {/* Subscription Pop-up */}
      {isLoggedIn && userEmail !== 'timegig2026@gmail.com' && (subscriptionStatus === 'none' || subscriptionStatus === 'rejected') && (
        <SubscriptionModal
          userEmail={userEmail}
          playTabSound={playTabSound}
          onSuccess={(type) => {
            setSubscriptionStatus('pending');
            // Status will be 'pending' in App state, modal will disappear
          }}
        />
      )}
    </div>
  );
}
