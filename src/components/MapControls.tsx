import React from 'react';
import { Plus, Minus, Layers, Navigation } from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleSatellite: () => void;
  onLocateUser: () => void;
  isSatellite: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onToggleSatellite,
  onLocateUser,
  isSatellite,
}) => {
  return (
    <div className="absolute bottom-32 right-6 z-30 flex flex-col gap-2.5 pointer-events-auto">
      {/* Locate Me Bubble */}
      <button
        type="button"
        onClick={onLocateUser}
        className="w-12 h-12 rounded-full bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 text-cyan-400 hover:bg-slate-800 hover:text-cyan-300 shadow-2xl shadow-black/60 flex items-center justify-center transition-all active:scale-95"
        title="Go to my location"
      >
        <Navigation className="w-5 h-5" />
      </button>

      {/* Satellite View Bubble */}
      <button
        type="button"
        onClick={onToggleSatellite}
        className={`w-12 h-12 rounded-full backdrop-blur-xl border shadow-2xl shadow-black/60 flex items-center justify-center transition-all active:scale-95 group ${
          isSatellite
            ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold'
            : 'bg-slate-900/90 border-slate-700/80 text-cyan-400 hover:bg-slate-800 hover:text-cyan-300'
        }`}
        title={isSatellite ? 'Switch to Street Map' : 'Switch to Satellite View'}
      >
        <Layers className={`w-5 h-5 transition-transform group-hover:rotate-12 ${isSatellite ? 'text-slate-950' : 'text-cyan-400'}`} />
      </button>

      {/* Zoom Bubbles Group */}
      <div className="flex flex-col rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl shadow-black/60 overflow-hidden divide-y divide-slate-800">
        <button
          type="button"
          onClick={onZoomIn}
          className="w-12 h-12 flex items-center justify-center text-slate-200 hover:text-cyan-300 hover:bg-slate-800/90 transition active:bg-slate-700"
          title="Zoom In"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          className="w-12 h-12 flex items-center justify-center text-slate-200 hover:text-cyan-300 hover:bg-slate-800/90 transition active:bg-slate-700"
          title="Zoom Out"
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
