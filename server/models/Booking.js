const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rideType: { type: String, required: true },
    description: { type: String },
    capacity: { type: String },
    price: { type: String, required: true },
    distanceKm: { type: Number },
    estimatedTime: { type: String },
    pickupAddress: { type: String, required: true },
    destinationAddress: { type: String, required: true },
    status: { type: String, enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'], default: 'requested' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', BookingSchema);



