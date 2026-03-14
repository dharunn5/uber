import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, CreditCard, Star, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../utils/api';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  const userType = localStorage.getItem('userType');

  const [firstName, setFirstName] = useState(localStorage.getItem('userFirstName') || '');
  const [lastName, setLastName] = useState(localStorage.getItem('userLastName') || '');
  const [email, setEmail] = useState(localStorage.getItem('userEmail') || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        const me = await get<any>('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFirstName(me.firstName || '');
        setLastName(me.lastName || '');
        setEmail(me.email || '');
        setPhone(me.phone || '');
        setAddress(me.location?.address || '');
      } catch (e) {
        // ignore load errors on profile page
      }
    })();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userType');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    navigate('/');
  };

  const userStats = {
    totalRides: userType === 'driver' ? 342 : 128,
    rating: userType === 'driver' ? 4.92 : 4.85,
    memberSince: '2022'
  };

  const paymentMethods = [
    { id: 1, type: 'Visa', last4: '1234', default: true },
    { id: 2, type: 'Mastercard', last4: '5678', default: false },
  ];

  const saveProfile = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      await post('/api/auth/me', { firstName, lastName, phone }, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (address && address.trim()) {
        await post('/api/auth/me/location', { address }, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      localStorage.setItem('userFirstName', firstName);
      localStorage.setItem('userLastName', lastName);
      localStorage.setItem('userName', `${firstName} ${lastName}`.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md">
          {/* Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {(firstName || lastName) ? `${firstName} ${lastName}`.trim() : 'User Name'}
                </h1>
                <p className="text-gray-600 capitalize">
                  {userType} • Member since {userStats.memberSince}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold">{userStats.rating}</span>
                  </div>
                  <div className="text-gray-600">
                    {userStats.totalRides} {userType === 'driver' ? 'trips completed' : 'rides taken'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 py-4 border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors duration-200`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payment'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors duration-200`}
              >
                Payment
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors duration-200`}
              >
                Settings
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          readOnly
                          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
                <button
                  onClick={saveProfile}
                  disabled={isSaving}
                  className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors duration-200 disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Update Profile'}
                </button>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <CreditCard className="h-6 w-6 text-gray-400" />
                          <div>
                            <p className="font-medium">{method.type} •••• {method.last4}</p>
                            {method.default && (
                              <span className="text-sm text-green-600">Default payment method</span>
                            )}
                          </div>
                        </div>
                        <button className="text-red-600 hover:text-red-700">Remove</button>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors duration-200">
                    Add Payment Method
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Payment History</h3>
                  <p className="text-gray-600 mb-4">View your recent transactions</p>
                  <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50 transition-colors duration-200">
                    View Payment History
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">Notifications</p>
                        <p className="text-sm text-gray-600">Manage your notification preferences</p>
                      </div>
                      <button className="text-black hover:text-gray-700">
                        <Settings className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-t border-gray-200">
                      <div>
                        <p className="font-medium">Privacy Settings</p>
                        <p className="text-sm text-gray-600">Control your data and privacy</p>
                      </div>
                      <button className="text-black hover:text-gray-700">
                        <Settings className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-t border-gray-200">
                      <div>
                        <p className="font-medium">Security</p>
                        <p className="text-sm text-gray-600">Change password and security settings</p>
                      </div>
                      <button className="text-black hover:text-gray-700">
                        <Settings className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors duration-200"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign out</span>
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

export default Profile;