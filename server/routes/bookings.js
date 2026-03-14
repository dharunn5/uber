const express = require('express');
const Booking = require('../models/Booking');
const { authenticateToken } = require('../middleware/auth');
const { sendMail } = require('../config/mail');

module.exports = router = express.Router();

const buildMailContent = (user, { rideType, description, capacity, price, estimatedTime, pickupAddress, destinationAddress, bookingTime }) => {
  const formattedCreatedAt = bookingTime
    ? new Date(bookingTime).toLocaleString()
    : new Date().toLocaleString();

  const subject = 'Your Uber Clone booking details';
  const body = `Hi ${user?.firstName || 'there'},\n\n` +
    `Thanks for booking a ride! Here are your trip details:\n` +
    `• Pickup: ${pickupAddress}\n` +
    `• Destination: ${destinationAddress}\n` +
    `• Ride Type: ${rideType}${description ? ` (${description})` : ''}\n` +
    `• Booking Time: ${formattedCreatedAt}\n` +
    `• Estimated Time: ${estimatedTime || 'Unavailable'}\n` +
    `• Capacity: ${capacity || 'N/A'}\n` +
    `• Price: ${price}\n\n` +
    `Have a great ride!`;

  return { subject, body };
};

const sendBookingConfirmationEmail = async (user, details) => {
  if (!user?.email) return;
  const { subject, body } = buildMailContent(user, details);
  await sendMail({ to: user.email, subject, text: body });
};

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { rideType, description, capacity, price, estimatedTime, pickupAddress, destinationAddress } = req.body;
    if (!rideType || !price || !pickupAddress || !destinationAddress) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const booking = await Booking.create({
      user: req.user._id,
      rideType,
      description,
      capacity,
      price,
      estimatedTime,
      pickupAddress,
      destinationAddress,
    });
    return res.status(201).json(booking);
  } catch (err) {
    console.error('Create booking error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/send-confirmation-email', authenticateToken, async (req, res) => {
  try {
    const { rideType, description, capacity, price, estimatedTime, pickupAddress, destinationAddress, bookingTime } = req.body;
    if (!rideType || !pickupAddress || !destinationAddress) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    await sendBookingConfirmationEmail(req.user, {
      rideType,
      description,
      capacity,
      price,
      estimatedTime,
      pickupAddress,
      destinationAddress,
      bookingTime,
    });
    return res.status(200).json({ message: 'Confirmation email sent' });
  } catch (err) {
    console.error('Send confirmation email error:', err);
    return res.status(500).json({ message: 'Failed to send confirmation email' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json(bookings);
  } catch (err) {
    console.error('List bookings error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a specific booking (must belong to requesting user)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return res.json(booking);
  } catch (err) {
    console.error('Get booking error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// List available bookings for drivers
router.get('/available/list', authenticateToken, async (req, res) => {
  try {
    // Only drivers should see available requests
    if (req.user.userType !== 'driver') {
      return res.status(403).json({ message: 'Drivers only' });
    }
    const bookings = await Booking.find({ status: 'requested' })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(bookings);
  } catch (err) {
    console.error('Available bookings error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Driver accepts a booking
router.put('/:id/accept', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'driver') {
      return res.status(403).json({ message: 'Drivers only' });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'requested') {
      return res.status(409).json({ message: 'Booking already claimed' });
    }
    booking.status = 'accepted';
    booking.driver = req.user._id;
    await booking.save();
    return res.json(booking);
  } catch (err) {
    console.error('Accept booking error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Cancel a booking (rider can cancel own; driver can cancel when requested or accepted)
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isRider = req.user.userType === 'rider' && booking.user.toString() === req.user._id.toString();
    const isDriver = req.user.userType === 'driver' && (!booking.driver || booking.driver.toString() === req.user._id.toString());

    if (!isRider && !isDriver) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(409).json({ message: `Cannot cancel a ${booking.status} booking` });
    }

    booking.status = 'cancelled';
    await booking.save();
    return res.json(booking);
  } catch (err) {
    console.error('Cancel booking error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get estimated ride time for a route
router.post('/estimate-time', async (req, res) => {
  try {
    const { pickupLat, pickupLng, destLat, destLng, rideType = 'UberX' } = req.body;

    if (!pickupLat || !pickupLng || !destLat || !destLng) {
      return res.status(400).json({ message: 'Missing required coordinates' });
    }

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in kilometers
    const lat1Rad = (pickupLat * Math.PI) / 180;
    const lat2Rad = (destLat * Math.PI) / 180;
    const deltaLatRad = ((destLat - pickupLat) * Math.PI) / 180;
    const deltaLngRad = ((destLng - pickupLng) * Math.PI) / 180;

    const a =
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Base speeds in km/h for different ride types
    const baseSpeeds = {
      'UberX': 35,
      'Comfort': 40,
      'UberXL': 32,
      'Black': 45,
    };

    const baseSpeed = baseSpeeds[rideType] || baseSpeeds['UberX'];
    const trafficFactor = 1.3;
    const pickupBuffer = 4;

    const drivingTimeHours = distance / baseSpeed;
    const drivingTimeMinutes = drivingTimeHours * 60;
    const totalTimeMinutes = (drivingTimeMinutes * trafficFactor) + pickupBuffer;

    const estimatedMinutes = Math.round(totalTimeMinutes);

    let estimatedTime;
    if (estimatedMinutes < 60) {
      estimatedTime = `${estimatedMinutes} min`;
    } else {
      const hours = Math.floor(estimatedMinutes / 60);
      const remainingMinutes = estimatedMinutes % 60;
      estimatedTime = remainingMinutes === 0
        ? `${hours} hr`
        : `${hours} hr ${remainingMinutes} min`;
    }

    return res.json({
      distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
      estimatedTime,
      estimatedMinutes
    });
  } catch (err) {
    console.error('Estimate time error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
