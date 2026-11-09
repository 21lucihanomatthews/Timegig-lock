import React, { useState } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';

interface TopSearchBarProps {
  onSelectLocation: (lat: number, lng: number, title: string) => void;
}

export const TopSearchBar: React.FC<TopSearchBarProps> = ({ onSelectLocation }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Check if query is coordinates like "40.7128, -74.0060"
    const coordMatch = query.match(/^([-+]?\d{1,2}(?:\.\d+)?)[,\s]+([-+]?\d{1,3}(?:\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        onSelectLocation(lat, lng, `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&addressdetails=1&limit=1`,
        {
          headers: { 'Accept-Language': 'en' },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const item = data[0];
          onSelectLocation(parseFloat(item.lat), parseFloat(item.lon), item.display_name);
        }
      }
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-xl pointer-events-auto">
      <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-slate-900/90 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/60 px-4 py-2.5 transition-all focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20">
        <Search className="w-4 h-4 text-cyan-400 mr-3 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search home number, street address, city, or province..."
          className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
        />
        {isLoading && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin ml-2 shrink-0" />}
        {query && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2 shrink-0"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>
    </div>
  );
};
