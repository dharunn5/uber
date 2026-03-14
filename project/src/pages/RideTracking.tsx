import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../utils/api';
import MapView from '../components/MapView';
import { geocodeAddress } from '../utils/locationService';

const RideTracking = () => {
  const [rideStatus, setRideStatus] = useState('finding'); // finding, assigned, pickup, enroute, completed, cancelled
  const [estimatedTime] = useState(2);
  const [findingElapsedSeconds, setFindingElapsedSeconds] = useState(0);
  const navigate = useNavigate();
  const lastBookingId = localStorage.getItem('lastBookingId');
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    const poll = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !lastBookingId) return;
        const booking = await get<any>(`/api/bookings/${lastBookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statusMap: Record<string, string> = {
          requested: 'finding',
          accepted: 'assigned',
          in_progress: 'enroute',
          completed: 'completed',
          cancelled: 'cancelled',
        };
        setRideStatus(statusMap[booking.status] || 'finding');
        // Geocode addresses once when not yet set
        if (!pickupCoords && booking.pickupAddress) {
          geocodeAddress(booking.pickupAddress).then((res) => {
            if (res) setPickupCoords([res.latitude, res.longitude]);
          }).catch(() => {});
        }
        if (!destCoords && booking.destinationAddress) {
          geocodeAddress(booking.destinationAddress).then((res) => {
            if (res) setDestCoords([res.latitude, res.longitude]);
          }).catch(() => {});
        }
        if (booking.status === 'cancelled') {
          clearInterval(timer);
        }
      } catch (_) {}
    };
    poll();
    timer = window.setInterval(poll, 4000);
    return () => { if (timer) window.clearInterval(timer); };
  }, [lastBookingId]);

  useEffect(() => {
    if (rideStatus === 'finding') {
      setFindingElapsedSeconds(0);
      const interval = window.setInterval(() => {
        setFindingElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => window.clearInterval(interval);
    }
    setFindingElapsedSeconds(0);
  }, [rideStatus]);

  const getStatusMessage = () => {
    switch (rideStatus) {
      case 'finding':
        return 'Finding your driver...';
      case 'assigned':
        return 'Driver assigned! John is on the way';
      case 'pickup':
        return 'John has arrived for pickup';
      case 'enroute':
        return 'On your way to destination';
      case 'cancelled':
        return 'Your ride was cancelled';
      case 'completed':
        return 'You have arrived at your destination!';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (rideStatus) {
      case 'finding':
        return 'text-yellow-600';
      case 'assigned':
      case 'pickup':
        return 'text-blue-600';
      case 'enroute':
        return 'text-green-600';
      case 'completed':
        return 'text-green-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden p-4">
              <MapView pickup={pickupCoords || null} destination={destCoords || null} />
            </div>
          </div>

          {/* Status and Details */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <div className={`text-2xl font-bold mb-2 ${getStatusColor()}`}>
                  {getStatusMessage()}
                </div>
                {rideStatus !== 'completed' && (
                  <p className="text-gray-600">
                    Estimated time: {estimatedTime} minutes
                  </p>
                )}
                {rideStatus === 'finding' && findingElapsedSeconds >= 120 && (
                  <p className="mt-3 text-sm text-red-600 font-medium">
                    Currently our drivers are not available. Please try again in a few minutes.
                  </p>
                )}
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full ${
                    ['finding', 'assigned', 'pickup', 'enroute', 'completed'].includes(rideStatus) 
                      ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span className="text-xs text-gray-500 mt-1">Booked</span>
                </div>
                <div className={`flex-1 h-1 mx-2 ${
                  ['assigned', 'pickup', 'enroute', 'completed'].includes(rideStatus) 
                    ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full ${
                    ['assigned', 'pickup', 'enroute', 'completed'].includes(rideStatus) 
                      ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span className="text-xs text-gray-500 mt-1">Pickup</span>
                </div>
                <div className={`flex-1 h-1 mx-2 ${
                  ['enroute', 'completed'].includes(rideStatus) 
                    ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full ${
                    rideStatus === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <span className="text-xs text-gray-500 mt-1">Dropoff</span>
                </div>
              </div>
            </div>

            {/* Driver details placeholder */}
            {rideStatus !== 'finding' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-2">Driver details</h3>
                <p className="text-gray-600 text-sm">
                  Driver information will appear here as soon as a driver accepts your ride.
                </p>
              </div>
            )}

            {/* Trip Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Trip details</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">123 Main Street</p>
                    <p className="text-sm text-gray-500">Downtown</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">456 Oak Avenue</p>
                    <p className="text-sm text-gray-500">Shopping District</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Fare estimate</span>
                  <span className="font-semibold text-lg">₹950</span>
                </div>
              </div>
            </div>

            {(rideStatus === 'completed' || rideStatus === 'cancelled') && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">{rideStatus === 'completed' ? '✅' : '⚠️'}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    {rideStatus === 'completed' ? 'Trip completed!' : 'Ride cancelled'}
                  </h3>
                  <p className="text-green-600 mb-4">
                    {rideStatus === 'completed' ? 'Thank you for riding with UberClone' : 'Sorry, your ride was cancelled' }
                  </p>
                  <button
                    onClick={() => navigate('/rider')}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors duration-200"
                  >
                    Back to home
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideTracking;