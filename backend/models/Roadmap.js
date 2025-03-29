const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'default'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: () => ({
      parent: '',
      level: 0
    })
  },
  position: {
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    }
  },
  style: {
    type: mongoose.Schema.Types.Mixed
  }
});

const EdgeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  target: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'default'
  },
  animated: {
    type: Boolean,
    default: false
  },
  style: {
    type: mongoose.Schema.Types.Mixed
  }
});

const ResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['article', 'video', 'course', 'book', 'tool', 'other'],
    default: 'article'
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  description: {
    type: String
  }
});

const RoadmapSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    default: function() {
      return this.id || null;
    }
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    enum: ['frontend', 'backend', 'fullstack', 'devops', 'mobile', 'ai', 'data', 'security', 'blockchain', 'other'],
    default: 'other'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  estimatedHours: {
    type: Number,
    default: 0,
    min: [0, 'Estimated hours cannot be negative']
  },
  prerequisites: {
    type: [String],
    default: []
  },
  author: {
    name: {
      type: String,
      default: 'TLE-BlueBit Team'
    },
    role: {
      type: String
    },
    avatar: {
      type: String
    }
  },
  resources: [ResourceSchema],
  nodes: [NodeSchema],
  edges: [EdgeSchema],
  isPopular: {
    type: Boolean,
    default: false
  },
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
RoadmapSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // Set slug to id if not provided
  if (!this.slug && this.id) {
    this.slug = this.id;
  }
  next();
});

module.exports = mongoose.model('Roadmap', RoadmapSchema);