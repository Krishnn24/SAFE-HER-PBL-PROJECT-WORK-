import { useState, useCallback } from "react";

interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface UseGeolocationResult {
  location: GeolocationData | null;
  error: string | null;
  loading: boolean;
  getLocation: () => Promise<GeolocationData | null>;
}

export const useGeolocation = (): UseGeolocationResult => {
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = useCallback(async (): Promise<GeolocationData | null> => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return null;
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setLocation(locationData);
          setLoading(false);
          resolve(locationData);
        },
        (err) => {
          let errorMessage = "Could not get location";
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = "Location permission denied";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = "Location unavailable";
              break;
            case err.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          setError(errorMessage);
          setLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return {
    location,
    error,
    loading,
    getLocation,
  };
};
