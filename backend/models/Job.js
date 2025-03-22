const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true
  },
  applyLink: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  companyDetails: {
    name: String,
    logo: String,
    about: String,
    rating: String,
    reviews: String
  },
  description: {
    type: String,
    required: true
  },
  jobDetails: {
    experience: String,
    salary: String,
    location: String,
    employmentType: String,
    postedDate: String,
    startDate: String,
    applicants: Number,
    openings: Number
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  },
  skills: [{
    type: String
  }],
  title: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema); 