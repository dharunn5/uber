import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Car, Navigation, CreditCard, LogOut } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import MapView from '../components/MapView';
import { useBrowserGeolocation } from '../hooks/useBrowserGeolocation';
import { geocodeAddress } from '../utils/locationService';
import { useLocationContext } from '../context/LocationContext';
import { useUser } from '../context/UserContext';

const RiderDashboard = () => {
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const { address: manualLocation, setAddress, coords: manualCoords } = useLocationContext();
  const { address: currentLocation, isLoading: isLoadingLocation, error: locationError, refetch } = useGeolocation();
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const { coords } = useBrowserGeolocation(true);
  const defaultCenter = { lat: 12.9716, lng: 77.5946 }; // Bengaluru
  const center = manualCoords
    ? { lat: manualCoords[0], lng: manualCoords[1] }
    : (coords || defaultCenter);
  const pickupArray: [number, number] = [center.lat, center.lng];
  const [bookings, setBookings] = useState<Array<{ _id: string; destinationAddress: string; createdAt: string; price: string; status: string }>>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const { user, refresh } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const loadBookings = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      setIsLoadingBookings(true);
      setBookingsError(null);
      try {
        const res = await fetch('http://localhost:5000/api/bookings', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('token');
            refresh();
            navigate('/login');
            return;
          }
          const err = await res.json().catch(() => null);
          throw new Error(err?.message || 'Failed to load bookings');
        }
        const data = await res.json();
        setBookings(data);
      } catch (e) {
        console.error('Failed to load bookings', e);
        setBookingsError(e instanceof Error ? e.message : 'Failed to load bookings');
      } finally {
        setIsLoadingBookings(false);
      }
    };
    loadBookings();
  }, [navigate, refresh]);

  // Geocode destination text into coordinates with a small debounce
  useEffect(() => {
    let timer: number | undefined;
    if (destination && destination.trim().length > 2) {
      timer = window.setTimeout(async () => {
        const result = await geocodeAddress(destination);
        if (result) {
          setDestinationCoords([result.latitude, result.longitude]);
        } else {
          setDestinationCoords(null);
        }
      }, 400);
    } else {
      setDestinationCoords(null);
    }
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [destination]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    refresh();
    navigate('/login');
  };

  const handleLocationToggle = () => {
    setUseCurrentLocation(!useCurrentLocation);
    if (!useCurrentLocation && !currentLocation) {
      refetch();
    }
  };

  const displayLocation = useCurrentLocation ? currentLocation : manualLocation;
  const locationPlaceholder = useCurrentLocation ? 
    (isLoadingLocation ? 'Getting your location...' : 'Current location') :
    'Enter pickup location';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Good morning, {(user?.firstName || localStorage.getItem('userFirstName') || 'Rider')}
              {user?.lastName ? ` ${user.lastName}` : ''}!
            </h1>
            <p className="text-gray-600">Where would you like to go today?</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white py-2 px-4 rounded-md font-semibold hover:bg-red-600 transition-colors duration-200 flex-shrink-0 flex items-center space-x-2"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-6">Book a ride</h2>
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Navigation className="h-5 w-5 text-green-500" />
                  </div>
                  <input
                    type="text"
                    placeholder={locationPlaceholder}
                    value={displayLocation}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (useCurrentLocation) {
                        setUseCurrentLocation(false);
                      }
                      setAddress(val);
                    }}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    onFocus={() => {
                      if (useCurrentLocation) {
                        setUseCurrentLocation(false);
                        setAddress(currentLocation || '');
                      }
                    }}
                  />
                  {isLoadingLocation && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleLocationToggle}
                    className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                    disabled={isLoadingLocation}
                  >
                    {useCurrentLocation ? 'Enter location manually' : 'Use current location'}
                  </button>
                  
                  {useCurrentLocation && locationError && (
                    <button
                      onClick={refetch}
                      className="text-sm text-red-600 hover:text-red-700 transition-colors duration-200"
                      disabled={isLoadingLocation}
                    >
                      Retry location
                    </button>
                  )}
                </div>
                
                {locationError && (
                  <p className="text-sm text-red-600 mt-1">{locationError}</p>
                )}
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-red-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Where to?"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>
                
                <Link
                  to={`/book-ride?pickup=${encodeURIComponent(displayLocation || '')}&dest=${encodeURIComponent(destination || '')}`}
                  className="w-full bg-black text-white py-3 px-6 rounded-md font-semibold hover:bg-gray-800 transition-colors duration-200 text-center block"
                >
                  Find rides
                </Link>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <MapView pickup={pickupArray} destination={destinationCoords || null} />
              <div className="text-center mt-3">
                <p className="text-gray-500">Showing nearby drivers and routes</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Quick actions</h3>
              <div className="space-y-3">
                <Link
                  to="/book-ride"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <Car className="h-5 w-5 text-gray-600" />
                  <span>Book a ride now</span>
                </Link>
                
                <Link
                  to="/history"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <Clock className="h-5 w-5 text-gray-600" />
                  <span>Ride history</span>
                </Link>
                
                <Link
                  to="/profile"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <CreditCard className="h-5 w-5 text-gray-600" />
                  <span>Payment methods</span>
                </Link>
              </div>
            </div>

            {/* Recent Trips */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Recent trips</h3>
              {bookingsError && (
                <p className="text-sm text-red-600 mb-3">{bookingsError}</p>
              )}
              {isLoadingBookings ? (
                <p className="text-gray-500">Loading your bookings...</p>
              ) : bookings.length === 0 ? (
                <p className="text-gray-500">No recent trips yet.</p>
              ) : (
                <div className="space-y-4">
                  {bookings.map((b) => (
                    <div key={b._id} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{b.destinationAddress}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(b.createdAt).toLocaleString()} • {b.status}
                          </p>
                        </div>
                        <span className="font-semibold text-gray-900">{b.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;