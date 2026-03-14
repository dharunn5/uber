const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    userType: { type: String, enum: ['rider', 'driver', 'admin'], required: true },
    location: {
      address: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
      updatedAt: { type: Date },
    },
    profile: {
      avatarUrl: { type: String },
      bio: { type: String },
      phone: { type: String },
    },
    driverDetails: {
      licenseNumber: { type: String },
      vehicleMake: { type: String },
      vehicleModel: { type: String },
      vehiclePlate: { type: String },
      yearsOfExperience: { type: Number },
    },
    driverStatus: {
      type: String,
      enum: ['pending', 'approved', 'suspended'],
      default: 'pending',
    },
    availability: {
      isOnline: { type: Boolean, default: false },
      lastOnlineAt: { type: Date },
    },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.statics.hashPassword = async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

module.exports = mongoose.model('User', UserSchema);




