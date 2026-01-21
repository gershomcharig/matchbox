'use client';

import { useState } from 'react';
import { Map as MapGL, ViewStateChangeEvent } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

// London coordinates for empty state
const LONDON_CENTER = {
  longitude: -0.1278,
  latitude: 51.5074,
};

const INITIAL_ZOOM = 11;

export default function Map() {
  const [viewState, setViewState] = useState({
    ...LONDON_CENTER,
    zoom: INITIAL_ZOOM,
  });

  const handleMove = (evt: ViewStateChangeEvent) => {
    setViewState(evt.viewState);
  };

  return (
    <MapGL
      {...viewState}
      onMove={handleMove}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
