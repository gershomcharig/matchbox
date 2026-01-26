'use client';

import { useState, useEffect, useCallback } from 'react';

export interface GeolocationState {
  location: { lat: number; lng: number } | null;
  error: string | null;
  permissionDenied: boolean;
  isLoading: boolean;
}

const initialState: GeolocationState = {
  location: null,
  error: null,
  permissionDenied: false,
  isLoading: true,
};

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>(initialState);

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setState({
        location: null,
        error: 'Geolocation is not supported by your browser',
        permissionDenied: false,
        isLoading: false,
      });
      return;
    }

    let watchId: number;

    const handleSuccess = (position: GeolocationPosition) => {
      setState({
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        error: null,
        permissionDenied: false,
        isLoading: false,
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage: string;
      let permissionDenied = false;

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied';
          permissionDenied = true;
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location unavailable';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out';
          break;
        default:
          errorMessage = 'An unknown error occurred';
      }

      setState({
        location: null,
        error: errorMessage,
        permissionDenied,
        isLoading: false,
      });
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000, // Cache position for 30 seconds
    };

    // Start watching position
    watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    // Cleanup on unmount
    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  return state;
}
