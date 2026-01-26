'use client';

import { Marker } from 'react-map-gl/mapbox';

interface UserLocationMarkerProps {
  lat: number;
  lng: number;
}

export default function UserLocationMarker({ lat, lng }: UserLocationMarkerProps) {
  return (
    <Marker latitude={lat} longitude={lng} anchor="center">
      <div className="relative flex items-center justify-center">
        {/* Pulsing outer ring */}
        <div className="absolute w-8 h-8 rounded-full bg-blue-500/20 animate-ping" />
        {/* Fading outer glow */}
        <div className="absolute w-6 h-6 rounded-full bg-blue-500/30" />
        {/* Main dot */}
        <div className="relative w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-lg shadow-blue-500/50" />
      </div>
    </Marker>
  );
}
