import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { geocodeAddress } from '../utils/locationService';
import { post } from '../utils/api';

export type LatLngTuple = [number, number];

interface LocationContextValue {
  address: string;
  coords: LatLngTuple | null;
  isResolving: boolean;
  error: string | null;
  setAddress: (value: string) => void;
  resolveAddressToCoords: (value?: string) => Promise<void>;
  clearManualLocation: () => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string>('');
  const [coords, setCoords] = useState<LatLngTuple | null>(null);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resolveAddressToCoords = useCallback(async (value?: string) => {
    const query = (value ?? address).trim();
    if (!query) {
      setCoords(null);
      setError(null);
      return;
    }
    setIsResolving(true);
    setError(null);
    try {
      const result = await geocodeAddress(query);
      if (result) {
        setCoords([result.latitude, result.longitude]);
        // Best-effort sync to backend if logged in
        try {
          const token = localStorage.getItem('token');
          if (token) {
            await post('/api/auth/me/location', {
              address: query,
              latitude: result.latitude,
              longitude: result.longitude,
            }, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        } catch (_) {
          // Non-fatal: ignore sync errors on client
        }
      } else {
        setCoords(null);
        setError('Location not found');
      }
    } catch (e) {
      setCoords(null);
      setError(e instanceof Error ? e.message : 'Failed to resolve location');
    } finally {
      setIsResolving(false);
    }
  }, [address]);

  const clearManualLocation = useCallback(() => {
    setAddress('');
    setCoords(null);
    setError(null);
  }, []);

  const value = useMemo<LocationContextValue>(() => ({
    address,
    coords,
    isResolving,
    error,
    setAddress,
    resolveAddressToCoords,
    clearManualLocation,
  }), [address, coords, isResolving, error, resolveAddressToCoords, clearManualLocation]);

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationContext must be used within a LocationProvider');
  return ctx;
}


