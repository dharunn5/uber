import { useState, useEffect } from 'react';
import { getCurrentLocationAddress } from '../utils/locationService';

interface UseGeolocationReturn {
  address: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useGeolocation = (autoFetch: boolean = true): UseGeolocationReturn => {
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const locationAddress = await getCurrentLocationAddress();
      setAddress(locationAddress);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      setAddress('');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchLocation();
    }
  }, [autoFetch]);

  return {
    address,
    isLoading,
    error,
    refetch: fetchLocation,
  };
};