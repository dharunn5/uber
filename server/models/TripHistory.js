const mongoose = require('mongoose');

const TripHistorySchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pickupAddress: { type: String, required: true },
    destinationAddress: { type: String, required: true },
    distanceKm: { type: Number },
    durationMinutes: { type: Number },
    fareAmount: { type: Number },
    rideType: { type: String },
    status: {
      type: String,
      enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'],
      default: 'requested',
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

TripHistorySchema.index({ driver: 1, createdAt: -1 });
TripHistorySchema.index({ rider: 1, createdAt: -1 });

module.exports = mongoose.model('TripHistory', TripHistorySchema);
