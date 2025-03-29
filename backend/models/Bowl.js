const mongoose = require('mongoose');

const bowlSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rules: {
    type: String,
    default: ''
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for search functionality
bowlSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Bowl = mongoose.model('Bowl', bowlSchema);

module.exports = Bowl; 