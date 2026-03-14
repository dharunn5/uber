const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const TripHistory = require('../models/TripHistory');
const Booking = require('../models/Booking');
const { authenticateToken, requireRoles } = require('../middleware/auth');

const router = express.Router();

const sanitizeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject({ virtuals: true });
  delete obj.passwordHash;
  return obj;
};

const ensureObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid id');
    error.status = 400;
    throw error;
  }
  return id;
};

router.use(authenticateToken, requireRoles('admin'));

router.get('/drivers', async (req, res) => {
  try {
    const { status, isOnline } = req.query;
    const query = { userType: 'driver' };
    if (status) {
      query.driverStatus = status;
    }
    if (typeof isOnline !== 'undefined') {
      query['availability.isOnline'] = isOnline === 'true';
    }
    const drivers = await User.find(query).sort({ createdAt: -1 });
    return res.json(drivers.map(sanitizeUser));
  } catch (err) {
    console.error('List drivers error:', err);
    return res.status(err.status || 500).json({ message: err.message || 'Failed to fetch drivers' });
  }
});

router.get('/riders', async (_req, res) => {
  try {
    const riders = await User.find({ userType: 'rider' }).sort({ createdAt: -1 });
    return res.json(riders.map(sanitizeUser));
  } catch (err) {
    console.error('List riders error:', err);
    return res.status(500).json({ message: 'Failed to fetch riders' });
  }
});

router.get('/active-drivers', async (_req, res) => {
  try {
    const drivers = await User.find({
      userType: 'driver',
      driverStatus: 'approved',
      'availability.isOnline': true,
    });
    return res.json(drivers.map(sanitizeUser));
  } catch (err) {
    console.error('List active drivers error:', err);
    return res.status(500).json({ message: 'Failed to fetch active drivers' });
  }
});

router.get('/drivers/:id/trips', async (req, res) => {
  try {
    const driverId = ensureObjectId(req.params.id);
    const trips = await TripHistory.find({ driver: driverId })
      .populate('rider', 'firstName lastName email')
      .populate('booking', '_id price status')
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(trips);
  } catch (err) {
    console.error('Driver trip history error:', err);
    return res.status(err.status || 500).json({ message: err.message || 'Failed to fetch trips' });
  }
});

router.get('/drivers/:id', async (req, res) => {
  try {
    const driverId = ensureObjectId(req.params.id);
    const driver = await User.findOne({ _id: driverId, userType: 'driver' });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    return res.json(sanitizeUser(driver));
  } catch (err) {
    console.error('Get driver error:', err);
    return res.status(err.status || 500).json({ message: err.message || 'Failed to fetch driver' });
  }
});

router.patch('/drivers/:id/status', async (req, res) => {
  try {
    const driverId = ensureObjectId(req.params.id);
    const { status } = req.body;
    const allowed = ['pending', 'approved', 'suspended'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const driver = await User.findOneAndUpdate(
      { _id: driverId, userType: 'driver' },
      { driverStatus: status },
      { new: true }
    );
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    return res.json(sanitizeUser(driver));
  } catch (err) {
    console.error('Update driver status error:', err);
    return res.status(err.status || 500).json({ message: err.message || 'Failed to update status' });
  }
});

router.patch('/drivers/:id/availability', async (req, res) => {
  try {
    const driverId = ensureObjectId(req.params.id);
    const { isOnline } = req.body;
    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({ message: 'isOnline must be boolean' });
    }
    const update = {
      'availability.isOnline': isOnline,
      'availability.lastOnlineAt': new Date(),
    };
    const driver = await User.findOneAndUpdate(
      { _id: driverId, userType: 'driver' },
      update,
      { new: true }
    );
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    return res.json(sanitizeUser(driver));
  } catch (err) {
    console.error('Update driver availability error:', err);
    return res.status(err.status || 500).json({ message: err.message || 'Failed to update availability' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const userId = ensureObjectId(req.params.id);
    const allowedFields = ['firstName', 'lastName', 'phone', 'profile', 'driverDetails'];
    const update = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: 'No updatable fields provided' });
    }
    const user = await User.findByIdAndUpdate(userId, update, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(sanitizeUser(user));
  } catch (err) {
    console.error('Update user profile error:', err);
    return res.status(err.status || 500).json({ message: err.message || 'Failed to update user' });
  }
});

router.get('/trips', async (req, res) => {
  try {
    const { driverId, riderId, status } = req.query;
    const query = {};
    if (driverId) {
      query.driver = driverId;
    }
    if (riderId) {
      query.rider = riderId;
    }
    if (status) {
      query.status = status;
    }
    const trips = await TripHistory.find(query)
      .populate('driver', 'firstName lastName email')
      .populate('rider', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(100);
    return res.json(trips);
  } catch (err) {
    console.error('List trip history error:', err);
    return res.status(500).json({ message: 'Failed to fetch trip history' });
  }
});

router.post('/trips', async (req, res) => {
  try {
    const trip = await TripHistory.create(req.body);
    return res.status(201).json(trip);
  } catch (err) {
    console.error('Create trip history error:', err);
    return res.status(400).json({ message: err.message || 'Failed to create trip entry' });
  }
});

router.put('/trips/:id', async (req, res) => {
  try {
    const tripId = ensureObjectId(req.params.id);
    const trip = await TripHistory.findByIdAndUpdate(tripId, req.body, { new: true });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    return res.json(trip);
  } catch (err) {
    console.error('Update trip history error:', err);
    return res.status(err.status || 500).json({ message: err.message || 'Failed to update trip' });
  }
});

module.exports = router;
