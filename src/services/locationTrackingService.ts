/**
 * Location Tracking Service
 * Handles continuous location updates during active SOS
 */

import { LocationUpdate } from "./sosService";

// Tracking configuration
const TRACKING_INTERVAL_MS = 7000; // Update every 7 seconds
const HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

type LocationCallback = (location: LocationUpdate) => void;
type ErrorCallback = (error: string) => void;

let watchId: number | null = null;
let intervalId: NodeJS.Timeout | null = null;
let lastLocation: LocationUpdate | null = null;

/**
 * Check if geolocation is available
 */
export const isGeolocationAvailable = (): boolean => {
  return "geolocation" in navigator;
};

/**
 * Request location permission and get current position
 */
export const getCurrentLocation = async (): Promise<LocationUpdate | null> => {
  if (!isGeolocationAvailable()) {
    console.warn("[Location] Geolocation not available");
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: LocationUpdate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
        };
        lastLocation = location;
        resolve(location);
      },
      (error) => {
        console.error("[Location] Error getting position:", error.message);
        resolve(null);
      },
      HIGH_ACCURACY_OPTIONS
    );
  });
};

/**
 * Start continuous location tracking
 * Calls onLocation callback every TRACKING_INTERVAL_MS with new position
 */
export const startLocationTracking = (
  onLocation: LocationCallback,
  onError?: ErrorCallback
): boolean => {
  if (!isGeolocationAvailable()) {
    onError?.("Geolocation not available");
    return false;
  }

  // Stop any existing tracking
  stopLocationTracking();

  console.log("[Location] Starting continuous tracking");

  // Use watchPosition for real-time updates
  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const location: LocationUpdate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(),
      };
      lastLocation = location;
    },
    (error) => {
      console.error("[Location] Watch error:", error.message);
      // Don't crash on errors, just log them
    },
    HIGH_ACCURACY_OPTIONS
  );

  // Send updates at fixed intervals
  intervalId = setInterval(() => {
    if (lastLocation) {
      console.log("[Location] Sending update:", lastLocation.latitude, lastLocation.longitude);
      onLocation(lastLocation);
    }
  }, TRACKING_INTERVAL_MS);

  return true;
};

/**
 * Stop location tracking
 */
export const stopLocationTracking = (): void => {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    console.log("[Location] Stopped watch");
  }

  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[Location] Stopped interval");
  }

  lastLocation = null;
};

/**
 * Get last known location
 */
export const getLastLocation = (): LocationUpdate | null => {
  return lastLocation;
};

/**
 * Check if currently tracking
 */
export const isTracking = (): boolean => {
  return watchId !== null && intervalId !== null;
};
