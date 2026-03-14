import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../utils/api';
import { CheckCircle2, Shield, Users, Activity, Edit3 } from 'lucide-react';

interface UserRecord {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  userType: 'rider' | 'driver' | 'admin';
  driverStatus?: 'pending' | 'approved' | 'suspended';
  availability?: {
    isOnline: boolean;
    lastOnlineAt?: string;
  };
  driverDetails?: {
    licenseNumber?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehiclePlate?: string;
    yearsOfExperience?: number;
  };
  profile?: {
    avatarUrl?: string;
    bio?: string;
    phone?: string;
  };
}

interface TripRecord {
  _id: string;
  pickupAddress: string;
  destinationAddress: string;
  rideType?: string;
  status: string;
  distanceKm?: number;
  durationMinutes?: number;
  fareAmount?: number;
  createdAt: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

  const [drivers, setDrivers] = useState<UserRecord[]>([]);
  const [riders, setRiders] = useState<UserRecord[]>([]);
  const [activeDrivers, setActiveDrivers] = useState<UserRecord[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<UserRecord | null>(null);
  const [driverTrips, setDriverTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    licenseNumber: '',
    vehicleMake: '',
    vehicleModel: '',
    vehiclePlate: '',
    yearsOfExperience: '',
  });

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  }), [token]);

  useEffect(() => {
    if (!token || userType !== 'admin') {
      navigate('/login');
    }
  }, [navigate, token, userType]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchDrivers(), fetchRiders(), fetchActiveDrivers()]);
      setError(null);
    } catch (err) {
      setError((err as Error).message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDrivers = async () => {
    const res = await fetch(`${BASE_URL}/api/admin/drivers`, { headers: authHeaders });
    if (!res.ok) throw new Error('Could not load drivers');
    const data = await res.json();
    setDrivers(data);
  };

  const fetchRiders = async () => {
    const res = await fetch(`${BASE_URL}/api/admin/riders`, { headers: authHeaders });
    if (!res.ok) throw new Error('Could not load riders');
    const data = await res.json();
    setRiders(data);
  };

  const fetchActiveDrivers = async () => {
    const res = await fetch(`${BASE_URL}/api/admin/active-drivers`, { headers: authHeaders });
    if (!res.ok) throw new Error('Could not load active drivers');
    const data = await res.json();
    setActiveDrivers(data);
  };

  const fetchDriverTrips = async (driverId: string) => {
    const res = await fetch(`${BASE_URL}/api/admin/drivers/${driverId}/trips`, { headers: authHeaders });
    if (!res.ok) throw new Error('Could not load trip history');
    const data = await res.json();
    setDriverTrips(data);
  };

  const handleSelectDriver = async (driver: UserRecord) => {
    setSelectedDriver(driver);
    try {
      await fetchDriverTrips(driver._id);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const updateDriverState = (updated: UserRecord) => {
    setDrivers((prev) => prev.map((d) => (d._id === updated._id ? updated : d)));
    setActiveDrivers((prev) => {
      const list = prev.filter((d) => d._id !== updated._id);
      if (updated.availability?.isOnline && updated.driverStatus === 'approved') {
        return [...list, updated];
      }
      return list;
    });
    if (selectedDriver?._id === updated._id) {
      setSelectedDriver(updated);
    }
  };

  const handleDriverStatusChange = async (driverId: string, status: 'pending' | 'approved' | 'suspended') => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/drivers/${driverId}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();
      updateDriverState(updated);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDriverAvailabilityChange = async (driverId: string, isOnline: boolean) => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/drivers/${driverId}/availability`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ isOnline }),
      });
      if (!res.ok) throw new Error('Failed to update availability');
      const updated = await res.json();
      updateDriverState(updated);
      fetchActiveDrivers();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const startEditingUser = (user: UserRecord) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || user.profile?.phone || '',
      licenseNumber: user.driverDetails?.licenseNumber || '',
      vehicleMake: user.driverDetails?.vehicleMake || '',
      vehicleModel: user.driverDetails?.vehicleModel || '',
      vehiclePlate: user.driverDetails?.vehiclePlate || '',
      yearsOfExperience: user.driverDetails?.yearsOfExperience?.toString() || '',
    });
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveUserProfile = async () => {
    if (!editingUser) return;
    try {
      setIsSaving(true);
      const payload: Record<string, unknown> = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
      };
      if (editingUser.userType === 'driver') {
        payload.driverDetails = {
          licenseNumber: editForm.licenseNumber,
          vehicleMake: editForm.vehicleMake,
          vehicleModel: editForm.vehicleModel,
          vehiclePlate: editForm.vehiclePlate,
          yearsOfExperience: editForm.yearsOfExperience ? Number(editForm.yearsOfExperience) : undefined,
        };
      }
      const res = await fetch(`${BASE_URL}/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save profile');
      const updated = await res.json();
      if (editingUser.userType === 'driver') {
        updateDriverState(updated);
      } else {
        setRiders((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      }
      setEditingUser(null);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!token || userType !== 'admin') {
    return null;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-gray-500">Control center</p>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <button
          onClick={fetchAll}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-4 flex items-center space-x-4">
          <div className="p-3 bg-gray-100 rounded-full">
            <Users className="h-6 w-6 text-gray-700" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total riders</p>
            <p className="text-2xl font-semibold">{riders.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex items-center space-x-4">
          <div className="p-3 bg-gray-100 rounded-full">
            <Shield className="h-6 w-6 text-gray-700" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Drivers</p>
            <p className="text-2xl font-semibold">{drivers.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 flex items-center space-x-4">
          <div className="p-3 bg-gray-100 rounded-full">
            <Activity className="h-6 w-6 text-gray-700" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active drivers</p>
            <p className="text-2xl font-semibold">{activeDrivers.length}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading admin data…</div>
      ) : (
        <div className="space-y-8">
          <section className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Drivers</h2>
              <p className="text-sm text-gray-500">Manage approval & availability</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Contact</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Online</th>
                    <th className="px-4 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {drivers.map((driver) => (
                    <tr key={driver._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleSelectDriver(driver)}
                          className="text-left text-gray-900 font-medium hover:underline"
                        >
                          {driver.firstName} {driver.lastName}
                        </button>
                        <p className="text-xs text-gray-500">{driver.driverDetails?.vehiclePlate || 'Plate N/A'}</p>
                      </td>
                      <td className="px-4 py-2">
                        <p>{driver.phone || driver.profile?.phone || '—'}</p>
                        <p className="text-xs text-gray-500">{driver.email}</p>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            driver.driverStatus === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : driver.driverStatus === 'suspended'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {driver.driverStatus}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              driver.availability?.isOnline ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          ></span>
                          <span className="text-xs text-gray-600">
                            {driver.availability?.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 space-y-1">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="text-xs px-2 py-1 border rounded-md"
                            onClick={() => handleDriverStatusChange(driver._id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            className="text-xs px-2 py-1 border rounded-md"
                            onClick={() => handleDriverStatusChange(driver._id, 'suspended')}
                          >
                            Suspend
                          </button>
                          <button
                            className="text-xs px-2 py-1 border rounded-md"
                            onClick={() => handleDriverStatusChange(driver._id, 'pending')}
                          >
                            Pending
                          </button>
                          <button
                            className="text-xs px-2 py-1 border rounded-md"
                            onClick={() => handleDriverAvailabilityChange(driver._id, !driver.availability?.isOnline)}
                          >
                            Set {driver.availability?.isOnline ? 'Offline' : 'Online'}
                          </button>
                          <button
                            className="text-xs px-2 py-1 border rounded-md flex items-center space-x-1"
                            onClick={() => startEditingUser(driver)}
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Riders</h2>
              <p className="text-sm text-gray-500">All rider accounts</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {riders.map((rider) => (
                <div key={rider._id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {rider.firstName} {rider.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{rider.email}</p>
                      <p className="text-sm text-gray-600">{rider.phone || rider.profile?.phone || 'Phone N/A'}</p>
                    </div>
                    <button
                      className="text-xs px-2 py-1 border rounded-md flex items-center space-x-1"
                      onClick={() => startEditingUser(rider)}
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {selectedDriver && (
            <section className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{selectedDriver.firstName}'s trips</h2>
                  <p className="text-sm text-gray-500">Most recent 50 trips</p>
                </div>
                <span className="text-sm text-gray-400">Driver ID: {selectedDriver._id}</span>
              </div>
              {driverTrips.length === 0 ? (
                <p className="text-gray-500 text-sm">No trip history yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="px-4 py-2">Pickup</th>
                        <th className="px-4 py-2">Destination</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Fare</th>
                        <th className="px-4 py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {driverTrips.map((trip) => (
                        <tr key={trip._id}>
                          <td className="px-4 py-2">{trip.pickupAddress}</td>
                          <td className="px-4 py-2">{trip.destinationAddress}</td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center space-x-1 text-xs font-medium text-gray-700">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>{trip.status}</span>
                            </span>
                          </td>
                          <td className="px-4 py-2">{trip.fareAmount ? `₹${trip.fareAmount}` : '—'}</td>
                          <td className="px-4 py-2 text-xs text-gray-500">
                            {new Date(trip.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {editingUser && (
            <section className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Edit {editingUser.userType} profile</h2>
                <button className="text-sm text-gray-500" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  name="firstName"
                  value={editForm.firstName}
                  onChange={handleEditInputChange}
                  className="border rounded-md px-3 py-2"
                  placeholder="First name"
                />
                <input
                  name="lastName"
                  value={editForm.lastName}
                  onChange={handleEditInputChange}
                  className="border rounded-md px-3 py-2"
                  placeholder="Last name"
                />
                <input
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditInputChange}
                  className="border rounded-md px-3 py-2"
                  placeholder="Phone"
                />
                {editingUser.userType === 'driver' && (
                  <>
                    <input
                      name="licenseNumber"
                      value={editForm.licenseNumber}
                      onChange={handleEditInputChange}
                      className="border rounded-md px-3 py-2"
                      placeholder="License number"
                    />
                    <input
                      name="vehicleMake"
                      value={editForm.vehicleMake}
                      onChange={handleEditInputChange}
                      className="border rounded-md px-3 py-2"
                      placeholder="Vehicle make"
                    />
                    <input
                      name="vehicleModel"
                      value={editForm.vehicleModel}
                      onChange={handleEditInputChange}
                      className="border rounded-md px-3 py-2"
                      placeholder="Vehicle model"
                    />
                    <input
                      name="vehiclePlate"
                      value={editForm.vehiclePlate}
                      onChange={handleEditInputChange}
                      className="border rounded-md px-3 py-2"
                      placeholder="Vehicle plate"
                    />
                    <input
                      name="yearsOfExperience"
                      value={editForm.yearsOfExperience}
                      onChange={handleEditInputChange}
                      className="border rounded-md px-3 py-2"
                      placeholder="Years of experience"
                    />
                  </>
                )}
              </div>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  className="px-4 py-2 rounded-md border"
                  onClick={() => setEditingUser(null)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-md bg-black text-white"
                  onClick={saveUserProfile}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
