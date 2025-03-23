const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  photoURL: {
    type: String
  },
  authType: {
    type: String,
    enum: ['email', 'google'],
    required: true
  },
  registrationComplete: {
    type: Boolean,
    default: false
  },
  resume: {
    url: String,
    filename: String,
    uploadedAt: Date
  },
  skills: [String],
  interests: [String],
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  AppliedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }]

});

// Update timestamp on save
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', UserSchema); 