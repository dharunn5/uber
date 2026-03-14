const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function createToken(user) {
  const payload = { sub: user._id.toString(), userType: user.userType };
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, userType } = req.body;
    if (!firstName || !lastName || !email || !phone || !password || !userType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ firstName, lastName, email, phone, passwordHash, userType });
    const token = createToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        location: user.location || null,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    if (!email || !password || !userType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = await User.findOne({ email: email.toLowerCase(), userType });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = createToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        location: user.location || null,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

// Profile routes
router.get('/me', authenticateToken, async (req, res) => {
  const user = req.user;
  return res.json({
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    userType: user.userType,
    location: user.location || null,
  });
});

router.put('/me', authenticateToken, async (req, res) => {
  try {
    const updatable = ['firstName', 'lastName', 'phone'];
    for (const key of updatable) {
      if (key in req.body) req.user[key] = req.body[key];
    }
    await req.user.save();
    return res.json({ message: 'Profile updated' });
  } catch (e) {
    console.error('Update profile error:', e);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
});

router.put('/me/location', authenticateToken, async (req, res) => {
  try {
    const { address, latitude, longitude } = req.body || {};
    req.user.location = {
      address: address || req.user.location?.address,
      latitude: typeof latitude === 'number' ? latitude : req.user.location?.latitude,
      longitude: typeof longitude === 'number' ? longitude : req.user.location?.longitude,
      updatedAt: new Date(),
    };
    await req.user.save();
    return res.json({ message: 'Location updated', location: req.user.location });
  } catch (e) {
    console.error('Update location error:', e);
    return res.status(500).json({ message: 'Failed to update location' });
  }
});




