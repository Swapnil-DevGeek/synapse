import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Indexed
    match: [/.+\@.+\..+/, 'Please fill a valid email address'],
  },
  password: {
    type: String, // Will be stored as a hash
    // Not required for OAuth users
  },
  provider: {
    type: String,
    default: 'credentials', // 'google' for OAuth users
  },
  // OTP fields for email verification
  otp: {
    type: String,
  },
  otpExpiry: {
    type: Date,
  },
  emailVerified: {
    type: Date,
  },
  image: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema); 