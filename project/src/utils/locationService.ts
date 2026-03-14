// Location service utilities
export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface AddressResult {
  formatted: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

export const getCurrentPosition = (): Promise<LocationCoords> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = 'Unknown error occurred';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};

export const reverseGeocode = async (coords: LocationCoords): Promise<AddressResult> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&addressdetails=1&accept-language=en`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch address');
    }
    
    const data = await response.json();
    
    return {
      formatted: data.display_name || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
      city: data.address?.city || data.address?.town || data.address?.village,
      state: data.address?.state,
      country: data.address?.country,
      postcode: data.address?.postcode,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      formatted: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
    };
  }
};

export const getCurrentLocationAddress = async (): Promise<string> => {
  try {
    const coords = await getCurrentPosition();
    const address = await reverseGeocode(coords);
    return address.formatted;
  } catch (error) {
    console.error('Error getting current location:', error);
    throw error;
  }
};

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

export const geocodeAddress = async (query: string): Promise<GeocodeResult | null> => {
  const trimmed = query.trim();
  if (!trimmed) return null;
  try {
    const params = new URLSearchParams({ format: 'json', q: trimmed, limit: '1', addressdetails: '0' });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { 'Accept-Language': 'en' },
    });
    if (!response.ok) {
      throw new Error('Failed to geocode address');
    }
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const top = data[0];
      return {
        latitude: parseFloat(top.lat),
        longitude: parseFloat(top.lon),
        displayName: top.display_name || trimmed,
      };
    }
    return null;
  } catch (error) {
    console.error('Forward geocoding error:', error);
    return null;
  }
};