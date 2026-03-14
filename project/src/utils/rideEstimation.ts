import { LocationCoords } from './locationService';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param from Starting coordinates
 * @param to Destination coordinates
 * @returns Distance in kilometers
 */
export const calculateDistance = (from: LocationCoords, to: LocationCoords): number => {
  const R = 6371; // Earth's radius in kilometers

  const lat1Rad = (from.latitude * Math.PI) / 180;
  const lat2Rad = (to.latitude * Math.PI) / 180;
  const deltaLatRad = ((to.latitude - from.latitude) * Math.PI) / 180;
  const deltaLngRad = ((to.longitude - from.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLngRad / 2) *
      Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Estimate ride time based on distance and ride type
 * @param distance Distance in kilometers
 * @param rideType Type of ride (affects speed and traffic considerations)
 * @returns Estimated time in minutes
 */
export const estimateRideTime = (distance: number, rideType: string = 'standard'): number => {
  // Base speeds in km/h for different ride types
  const baseSpeeds: Record<string, number> = {
    'UberX': 35,      // Standard speed for economy rides
    'Comfort': 40,    // Slightly faster for comfort rides
    'UberXL': 32,     // Slower for larger vehicles
    'Black': 45,      // Fastest for premium rides
  };

  const baseSpeed = baseSpeeds[rideType] || baseSpeeds['UberX'];

  // Add traffic factor (typically 1.2 to 2.0 multiplier for city traffic)
  const trafficFactor = 1.3;

  // Add buffer for pickup time (typically 3-5 minutes)
  const pickupBuffer = 4;

  // Calculate time in hours, then convert to minutes
  const drivingTimeHours = distance / baseSpeed;
  const drivingTimeMinutes = drivingTimeHours * 60;

  // Apply traffic factor and add pickup buffer
  const totalTimeMinutes = (drivingTimeMinutes * trafficFactor) + pickupBuffer;

  return Math.round(totalTimeMinutes);
};

/**
 * Get estimated time string for display
 * @param minutes Time in minutes
 * @returns Formatted time string
 */
export const formatEstimatedTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hr`;
    } else {
      return `${hours} hr ${remainingMinutes} min`;
    }
  }
};

/**
 * Calculate estimated ride time between two coordinates
 * @param pickup Pickup coordinates
 * @param destination Destination coordinates
 * @param rideType Type of ride
 * @returns Formatted estimated time string
 */
export const getEstimatedRideTime = (
  pickup: LocationCoords,
  destination: LocationCoords,
  rideType: string = 'UberX'
): string => {
  const distance = calculateDistance(pickup, destination);
  const timeInMinutes = estimateRideTime(distance, rideType);

  return formatEstimatedTime(timeInMinutes);
};
