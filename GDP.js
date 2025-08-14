const mongoose = require('mongoose');

const gdpSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 1960,
    max: new Date().getFullYear()
  },
  gdpInUSD: {
    type: Number,
    required: true,
    min: 0
  },
  gdpPerCapita: {
    type: Number,
    required: true,
    min: 0
  },
  growthRate: {
    type: Number,
    default: 0
  },
  region: {
    type: String,
    required: true,
    enum: ['Asia', 'Europe', 'North America', 'South America', 'Africa', 'Oceania']
  }
}, {
  timestamps: true
});

// Create compound index for unique country-year combination
gdpSchema.index({ country: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('GDP', gdpSchema);