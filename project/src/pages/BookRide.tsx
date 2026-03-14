import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Clock, Users } from 'lucide-react';
import Map from '../components/Map';
import MapView from '../components/MapView';
import { useBrowserGeolocation } from '../hooks/useBrowserGeolocation';
import { geocodeAddress, reverseGeocode } from '../utils/locationService';
import { useLocationContext } from '../context/LocationContext';
import { useUser } from '../context/UserContext';
import { getEstimatedRideTime, calculateDistance } from '../utils/rideEstimation';

interface RideOption {
  id: number;
  type: string;
  description: string;
  capacity: string;
  price: string;
  estimatedTime: string;
  distance?: number;
  fareAmount: number;
  icon: string;
}

const PRICE_PER_KM: Record<string, number> = {
  UberX: 10,
  Comfort: 15,
  UberXL: 20,
  Black: 25,
};

const formatFare = (amount: number) => `₹${Math.round(amount)}`;

const calculateRideFare = (distanceKm: number, rideType: string) => {
  if (!distanceKm || distanceKm <= 0) {
    return 0;
  }
  const rate = PRICE_PER_KM[rideType] || PRICE_PER_KM['UberX'];
  return distanceKm * rate;
};

const BookRide = () => {
  const [step, setStep] = useState(1);
  const [selectedRide, setSelectedRide] = useState<RideOption | null>(null);
  const navigate = useNavigate();
  const { coords } = useBrowserGeolocation(true);
  const { coords: manualCoords } = useLocationContext();
  const { user } = useUser();
  const defaultCenter = { lat: 12.9716, lng: 77.5946 }; // Bengaluru
  const center = manualCoords
    ? { lat: manualCoords[0], lng: manualCoords[1] }
    : (coords || defaultCenter);
  const pickupArray: [number, number] = [center.lat, center.lng];
  const location = useLocation();
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const pickupQuery = urlParams.get('pickup') || '';
  const destQuery = urlParams.get('dest') || '';
  const [pickupOverride, setPickupOverride] = useState<[number, number] | null>(null);
  const [destOverride, setDestOverride] = useState<[number, number] | null>(null);
  const [pickupAddress, setPickupAddress] = useState('Fetching location...');
  const [destinationAddress, setDestinationAddress] = useState('Select a destination');

  useEffect(() => {
    console.log('URL Params:', { pickupQuery, destQuery });
    let active = true;
    const run = async () => {
      if (pickupQuery && pickupQuery.trim().length > 2) {
        const res = await geocodeAddress(pickupQuery);
        if (active) {
          console.log('Geocoded Pickup:', res);
          setPickupOverride(res ? [res.latitude, res.longitude] : null);
        }
      } else {
        // use user's saved location if available
        if (user?.location?.latitude && user?.location?.longitude) {
          setPickupOverride([user.location.latitude, user.location.longitude]);
        } else {
          setPickupOverride(null);
        }
      }
      if (destQuery && destQuery.trim().length > 2) {
        const res = await geocodeAddress(destQuery);
        if (active) {
          console.log('Geocoded Destination:', res);
          setDestOverride(res ? [res.latitude, res.longitude] : null);
        }
      } else {
        setDestOverride(null);
      }
    };
    run();
    return () => { active = false; };
  }, [pickupQuery, destQuery, user?.location?.latitude, user?.location?.longitude]);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (pickupOverride) {
        const address = await reverseGeocode({ latitude: pickupOverride[0], longitude: pickupOverride[1] });
        setPickupAddress(address.formatted || 'Unknown location');
      } else if (pickupArray) {
        const address = await reverseGeocode({ latitude: pickupArray[0], longitude: pickupArray[1] });
        setPickupAddress(address.formatted || 'Current location');
      }

      if (destOverride) {
        const address = await reverseGeocode({ latitude: destOverride[0], longitude: destOverride[1] });
        setDestinationAddress(address.formatted || 'Unknown location');
      } else {
        setDestinationAddress('Select a destination');
      }
    };
    fetchAddresses();
  }, [pickupOverride, destOverride, pickupArray]);

  const getPreviewDestination = (ride: RideOption | null): [number, number] => {
    // Slight offsets by ride type to visually differentiate map preview without routing API
    if (!ride) return [12.9352, 77.6245];
    const offsets: Record<number, [number, number]> = {
      1: [0.0105, 0.014],   // UberX
      2: [0.016, 0.020],    // Comfort
      3: [0.024, 0.028],    // UberXL
      4: [0.032, 0.036],    // Black
    };
    const [dLat, dLng] = offsets[ride.id] || [0.0105, 0.014];
    return [center.lat + dLat, center.lng + dLng];
  };

  const rideOptions = useMemo(() => {
    const pickupCoords = pickupOverride || pickupArray;
    const destCoords = destOverride;

    // Early return when coordinates are not available
    if (!destCoords || !pickupCoords) {
      return [
        {
          id: 1,
          type: 'UberX',
          description: 'Affordable, everyday rides',
          capacity: '4',
          price: '₹0',
          estimatedTime: 'Calculating...',
          distance: undefined,
          fareAmount: 0,
          icon: '🚗'
        },
        {
          id: 2,
          type: 'Comfort',
          description: 'Newer cars with extra legroom',
          capacity: '4',
          price: '₹0',
          estimatedTime: 'Calculating...',
          distance: undefined,
          fareAmount: 0,
          icon: '🚙'
        },
        {
          id: 3,
          type: 'UberXL',
          description: 'Affordable rides for groups up to 6',
          capacity: '6',
          price: '₹0',
          estimatedTime: 'Calculating...',
          distance: undefined,
          fareAmount: 0,
          icon: '🚐'
        },
        {
          id: 4,
          type: 'Black',
          description: 'Premium rides in luxury cars',
          capacity: '4',
          price: '₹0',
          estimatedTime: 'Calculating...',
          distance: undefined,
          fareAmount: 0,
          icon: '🏎️'
        }
      ];
    }

    // Calculate distance once for all ride types
    const distance = calculateDistance(
      { latitude: pickupCoords[0], longitude: pickupCoords[1] },
      { latitude: destCoords[0], longitude: destCoords[1] }
    );

    const calculatedDistance = Math.round(distance * 100) / 100;

    // Return ride options with calculated times and distance
    return [
      {
        id: 1,
        type: 'UberX',
        description: 'Affordable, everyday rides',
        capacity: '4',
        price: formatFare(calculateRideFare(calculatedDistance, 'UberX')),
        estimatedTime: getEstimatedRideTime(
          { latitude: pickupCoords[0], longitude: pickupCoords[1] },
          { latitude: destCoords[0], longitude: destCoords[1] },
          'UberX'
        ),
        distance: calculatedDistance,
        fareAmount: calculateRideFare(calculatedDistance, 'UberX'),
        icon: '🚗'
      },
      {
        id: 2,
        type: 'Comfort',
        description: 'Newer cars with extra legroom',
        capacity: '4',
        price: formatFare(calculateRideFare(calculatedDistance, 'Comfort')),
        estimatedTime: getEstimatedRideTime(
          { latitude: pickupCoords[0], longitude: pickupCoords[1] },
          { latitude: destCoords[0], longitude: destCoords[1] },
          'Comfort'
        ),
        distance: calculatedDistance,
        fareAmount: calculateRideFare(calculatedDistance, 'Comfort'),
        icon: '🚙'
      },
      {
        id: 3,
        type: 'UberXL',
        description: 'Affordable rides for groups up to 6',
        capacity: '6',
        price: formatFare(calculateRideFare(calculatedDistance, 'UberXL')),
        estimatedTime: getEstimatedRideTime(
          { latitude: pickupCoords[0], longitude: pickupCoords[1] },
          { latitude: destCoords[0], longitude: destCoords[1] },
          'UberXL'
        ),
        distance: calculatedDistance,
        fareAmount: calculateRideFare(calculatedDistance, 'UberXL'),
        icon: '🚐'
      },
      {
        id: 4,
        type: 'Black',
        description: 'Premium rides in luxury cars',
        capacity: '4',
        price: formatFare(calculateRideFare(calculatedDistance, 'Black')),
        estimatedTime: getEstimatedRideTime(
          { latitude: pickupCoords[0], longitude: pickupCoords[1] },
          { latitude: destCoords[0], longitude: destCoords[1] },
          'Black'
        ),
        distance: calculatedDistance,
        fareAmount: calculateRideFare(calculatedDistance, 'Black'),
        icon: '🏎️'
      }
    ];
  }, [destOverride, pickupOverride, pickupArray]);

  const handleRideSelection = (ride: RideOption) => {
    setSelectedRide(ride);
    setStep(2);
  };

  const handleBookRide = async () => {
    if (!selectedRide) return;

    const currentPickupCoords = pickupOverride || pickupArray;
    const currentDestCoords = destOverride;

    if (!currentDestCoords || !currentPickupCoords || !selectedRide.distance) {
      alert('Please select valid pickup and destination locations to compute the fare.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to book a ride');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rideType: selectedRide.type,
          description: selectedRide.description,
          capacity: selectedRide.capacity,
          estimatedTime: selectedRide.estimatedTime,
          pickupAddress: user?.location?.address || pickupQuery || `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`,
          destinationAddress: destQuery || 'Destination not set',
          distanceKm: selectedRide.distance,
          pickupCoordinates: {
            latitude: currentPickupCoords[0],
            longitude: currentPickupCoords[1],
          },
          destinationCoordinates: {
            latitude: currentDestCoords[0],
            longitude: currentDestCoords[1],
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('Session expired. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('isLoggedIn');
          navigate('/login');
          return;
        }
        const err = await response.json().catch(() => null);
        throw new Error(err?.message || 'Failed to book ride');
      }

      const booking = await response.json();
      console.log('Booking created:', booking);
      if (booking?._id) {
        localStorage.setItem('lastBookingId', booking._id);
      }
      navigate('/ride-tracking');
    } catch (e) {
      console.error('Failed to create booking', e);
      alert(e instanceof Error ? e.message : 'Failed to book ride. Please try again.');
    }
  };

  // Calculate overall trip info for preview
  const tripInfo = useMemo(() => {
    if (destOverride && (pickupOverride || pickupArray)) {
      const pickupCoords = pickupOverride || pickupArray;
      const distance = calculateDistance(
        { latitude: pickupCoords[0], longitude: pickupCoords[1] },
        { latitude: destOverride[0], longitude: destOverride[1] }
      );

      // Use average speed for general estimate (around 35 km/h)
      const avgTimeInMinutes = Math.round((distance / 35) * 60) + 4; // +4 min for pickup

      return {
        distance: Math.round(distance * 100) / 100,
        estimatedTime: avgTimeInMinutes < 60
          ? `${avgTimeInMinutes} min`
          : `${Math.floor(avgTimeInMinutes / 60)} hr ${avgTimeInMinutes % 60} min`
      };
    }
    return null;
  }, [destOverride, pickupOverride, pickupArray]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => step === 1 ? navigate('/rider') : setStep(1)}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {step === 1 ? 'Choose a ride' : 'Confirm your ride'}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Content */}
          <div className="order-2 lg:order-1">
            {step === 1 ? (
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Navigation className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-gray-600">Pickup</span>
                  </div>
                  <p className="font-semibold mb-4">{pickupAddress}</p>

                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-gray-600">Destination</span>
                  </div>
                  <p className="font-semibold">{destinationAddress}</p>

                  {/* Trip Preview */}
                  {tripInfo && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-gray-700">
                              Est. {tripInfo.estimatedTime}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Navigation className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500">
                              {tripInfo.distance} km
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {rideOptions.map((ride) => (
                    <div
                      key={ride.id}
                      onClick={() => handleRideSelection(ride)}
                      className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 border-transparent hover:border-black"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl">{ride.icon}</span>
                          <div>
                            <h3 className="font-semibold text-lg">{ride.type}</h3>
                            <p className="text-gray-600 text-sm">{ride.description}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-500">{ride.capacity}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-500">{ride.estimatedTime}</span>
                              </div>
                              {ride.distance !== undefined && (
                                <div className="flex items-center space-x-1">
                                  <Navigation className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm text-gray-500">{ride.distance} km</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">{ride.price}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Ride Details</h2>

                  <div className="flex items-center space-x-4 mb-6">
                    <span className="text-3xl">{selectedRide?.icon}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{selectedRide?.type}</h3>
                      <p className="text-gray-600">{selectedRide?.description}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-2xl font-bold">{selectedRide?.price}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Navigation className="h-5 w-5 text-green-500" />
                        <span className="font-medium">{pickupAddress}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-red-500" />
                        <span className="font-medium">{destinationAddress}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Estimated time: {selectedRide?.estimatedTime}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Driver Details</h3>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xl">👨‍💼</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">John Smith</h4>
                      <p className="text-gray-600">Toyota Camry • ABC 123</p>
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm">4.95 (1,234 trips)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded text-white flex items-center justify-center text-sm font-bold">
                      💳
                    </div>
                    <span>•••• •••• •••• 1234</span>
                  </div>
                </div>

                <button
                  onClick={handleBookRide}
                  className="w-full bg-black text-white py-4 px-6 rounded-md font-semibold hover:bg-gray-800 transition-colors duration-200 text-lg"
                >
                  Confirm {selectedRide?.type}
                </button>
              </div>
            )}
          </div>

          {/* Map */}
          <div className="order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <MapView
                pickup={pickupOverride || pickupArray}
                destination={destOverride || getPreviewDestination(selectedRide)}
              />
              <div className="mt-3 text-center">
                <p className="text-gray-500 mb-1">Route Preview</p>
                <p className="text-sm text-gray-400">
                  {step === 1 ? 'Select a ride to see route details' : 'Your driver is on the way'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookRide;
