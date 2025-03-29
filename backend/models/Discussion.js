const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  votes: {
    type: Number,
    default: 0
  },
  votedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

const pollSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [pollOptionSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  endDate: Date
});

const discussionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  bowlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bowl',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  likedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bookmarkedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  attachments: [{
    type: String // URL to uploaded files
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  poll: pollSchema,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
discussionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create index for search functionality
discussionSchema.index({ title: 'text', body: 'text', tags: 'text' });

const Discussion = mongoose.model('Discussion', discussionSchema);

module.exports = Discussion; 