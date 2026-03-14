import React, { useState } from 'react';
import { Calendar, MapPin, Star, Download, Filter, Navigation } from 'lucide-react';

const RideHistory = () => {
  const [filter, setFilter] = useState('all'); // all, completed, cancelled
  const userType = localStorage.getItem('userType');

  const rideHistory = [
    {
      id: 1,
      date: '2024-01-15',
      time: '14:30',
      from: '123 Main Street',
      to: 'Downtown Mall',
      distance: '2.3 miles',
      duration: '12 mins',
      fare: '₹950',
      status: 'completed',
      rating: 5,
      driverName: 'John Smith',
      vehicleType: 'UberX'
    },
    {
      id: 2,
      date: '2024-01-14',
      time: '09:15',
      from: 'Home',
      to: 'Airport Terminal 1',
      distance: '15.2 miles',
      duration: '35 mins',
      fare: '₹3,415',
      status: 'completed',
      rating: 4,
      driverName: 'Sarah Wilson',
      vehicleType: 'Comfort'
    },
    {
      id: 3,
      date: '2024-01-13',
      time: '18:45',
      from: 'Office Building',
      to: 'Central Park',
      distance: '5.1 miles',
      duration: '18 mins',
      fare: '₹1,420',
      status: 'completed',
      rating: 5,
      driverName: 'Mike Chen',
      vehicleType: 'UberX'
    },
    {
      id: 4,
      date: '2024-01-12',
      time: '12:00',
      from: 'Restaurant District',
      to: 'Shopping Center',
      distance: '3.8 miles',
      duration: '15 mins',
      fare: '₹0',
      status: 'cancelled',
      rating: null,
      driverName: 'Emily Davis',
      vehicleType: 'UberX'
    },
    {
      id: 5,
      date: '2024-01-11',
      time: '16:20',
      from: '456 Oak Avenue',
      to: 'City Hospital',
      distance: '7.2 miles',
      duration: '25 mins',
      fare: '₹1,685',
      status: 'completed',
      rating: 4,
      driverName: 'David Brown',
      vehicleType: 'UberXL'
    }
  ];

  const filteredHistory = rideHistory.filter(ride => {
    if (filter === 'all') return true;
    return ride.status === filter;
  });

  const totalSpent = rideHistory
    .filter(ride => ride.status === 'completed')
    .reduce((sum, ride) => sum + parseFloat(ride.fare.replace('₹', '').replace(',', '')), 0);

  const totalRides = rideHistory.filter(ride => ride.status === 'completed').length;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {userType === 'driver' ? 'Trip History' : 'Ride History'}
          </h1>
          <p className="text-gray-600">
            View all your {userType === 'driver' ? 'completed trips' : 'past rides'} and details
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total {userType === 'driver' ? 'Trips' : 'Rides'}
                </p>
                <p className="text-2xl font-bold text-gray-900">{totalRides}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {userType === 'driver' ? 'Total Earned' : 'Total Spent'}
                </p>
                <p className="text-2xl font-bold text-gray-900">₹{totalSpent.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Download className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">4.8</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and History */}
        <div className="bg-white rounded-lg shadow-md">
          {/* Filter Bar */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Filter className="h-5 w-5 text-gray-400" />
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      filter === 'all'
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition-colors duration-200`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('completed')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      filter === 'completed'
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition-colors duration-200`}
                  >
                    Completed
                  </button>
                  <button
                    onClick={() => setFilter('cancelled')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      filter === 'cancelled'
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition-colors duration-200`}
                  >
                    Cancelled
                  </button>
                </div>
              </div>
              
              <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors duration-200">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* History List */}
          <div className="p-6">
            <div className="space-y-4">
              {filteredHistory.map((ride) => (
                <div key={ride.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatDate(ride.date)} at {ride.time}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">•</span>
                        <span className="text-sm font-medium text-gray-900">{ride.vehicleType}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ride.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Navigation className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700">{ride.from}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-gray-700">{ride.to}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                        <span>{ride.distance}</span>
                        <span>•</span>
                        <span>{ride.duration}</span>
                        {userType === 'rider' && (
                          <>
                            <span>•</span>
                            <span>Driver: {ride.driverName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      {ride.rating && (
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < ride.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">{ride.fare}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredHistory.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No {filter} rides found</p>
                <p className="text-sm text-gray-400">
                  Try adjusting your filter or take a ride to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideHistory;