import { useEffect, useState } from 'react';

export interface Coordinates {
  lat: number;
  lng: number;
}

interface UseBrowserGeolocationReturn {
  coords: Coordinates | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useBrowserGeolocation = (autoFetch: boolean = true): UseBrowserGeolocationReturn => {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLoading(false);
      },
      (err) => {
        setError(err.message || 'Failed to get current location');
        setCoords(null);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    if (autoFetch) fetchLocation();
  }, [autoFetch]);

  return { coords, isLoading, error, refetch: fetchLocation };
};
