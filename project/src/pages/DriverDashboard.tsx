import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, DollarSign, Clock, MapPin, ToggleLeft, ToggleRight, Star, User } from 'lucide-react';
import { useBrowserGeolocation } from '../hooks/useBrowserGeolocation';
import MapView from '../components/MapView';
import { useUser } from '../context/UserContext';
import { get } from '../utils/api';

const DriverDashboard = () => {
  const [isOnline, setIsOnline] = useState(false);
  const { user } = useUser();
  const { coords, error } = useBrowserGeolocation(isOnline);
  const locationCoords: [number, number] | null = coords ? [coords.lat, coords.lng] : null;

  const [rideRequests, setRideRequests] = useState<any[]>([]);
  useEffect(() => {
    let timer: number | undefined;
    const fetchAvailable = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const data = await get<any>('/api/bookings/available/list', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRideRequests(Array.isArray(data) ? data : []);
      } catch (_) {}
    };
    if (isOnline) {
      fetchAvailable();
      timer = window.setInterval(fetchAvailable, 4000);
    }
    return () => { if (timer) window.clearInterval(timer); };
  }, [isOnline]);

  const todayStats = {
    earnings: 11025,
    trips: 12,
    hours: 6.5,
    rating: 4.92
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Driver Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {(user?.firstName || 'Driver')}{user?.lastName ? ` ${user.lastName}` : ''}!
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-gray-600'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
              <button
                onClick={() => setIsOnline(!isOnline)}
                className="focus:outline-none"
              >
                {isOnline ? (
                  <ToggleRight className="h-8 w-8 text-green-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Cards */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Earnings</p>
                    <p className="text-2xl font-bold text-green-600">₹{todayStats.earnings.toLocaleString('en-IN')}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Trips Completed</p>
                    <p className="text-2xl font-bold text-blue-600">{todayStats.trips}</p>
                  </div>
                  <Car className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hours Online</p>
                    <p className="text-2xl font-bold text-purple-600">{todayStats.hours}</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rating</p>
                    <p className="text-2xl font-bold text-yellow-600">{todayStats.rating}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Ride Requests */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6">
                {isOnline ? 'Available Ride Requests' : 'Go online to see ride requests'}
              </h2>
              
              {isOnline ? (
                <div className="space-y-4">
                  {rideRequests.length === 0 && (
                    <p className="text-gray-500">No available ride requests right now.</p>
                  )}
                  {rideRequests.map((request) => (
                    <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">New ride request</p>
                            <p className="text-sm text-gray-600">{new Date(request.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{request.price}</p>
                          <p className="text-sm text-gray-500 capitalize">{request.rideType}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{request.pickupAddress}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{request.destinationAddress}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('token');
                              if (!token) return;
                              await fetch('http://localhost:5000/api/bookings/' + request._id + '/accept', {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`,
                                },
                              });
                              setRideRequests((prev) => prev.filter((b) => b._id !== request._id));
                            } catch (_) {}
                          }}
                          className="flex-1 bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors duration-200"
                        >
                          Accept
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('token');
                              if (!token) return;
                              await fetch('http://localhost:5000/api/bookings/' + request._id + '/cancel', {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`,
                                },
                              });
                              setRideRequests((prev) => prev.filter((b) => b._id !== request._id));
                            } catch (_) {}
                          }}
                          className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors duration-200"
                        >
                          Decline
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">Tap accept to claim this ride</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">You're currently offline</p>
                  <button
                    onClick={() => setIsOnline(true)}
                    className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors duration-200"
                  >
                    Go Online
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Map and Quick Actions */}
          <div className="space-y-6">
            {/* Map Placeholder */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Your Location</h3>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center">
                {locationCoords ? (
                  <MapView pickup={locationCoords} destination={null} />
                ) : (
                  <div className="text-center px-4">
                    <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-700">
                      {isOnline ? 'Fetching location...' : 'Go online to see your location'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/history"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <Clock className="h-5 w-5 text-gray-600" />
                  <span>Trip History</span>
                </Link>
                
                <Link
                  to="/profile"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <User className="h-5 w-5 text-gray-600" />
                  <span>Profile Settings</span>
                </Link>
                
                <button className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 w-full">
                  <DollarSign className="h-5 w-5 text-gray-600" />
                  <span>Earnings Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;