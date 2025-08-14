const express = require('express');
const router = express.Router();
const GDP = require('../models/GDP');

// GET all GDP records with optional filters
router.get('/', async (req, res) => {
  try {
    const { country, year, region, sortBy = 'year', order = 'desc' } = req.query;
    
    let query = {};
    if (country) query.country = { $regex: country, $options: 'i' };
    if (year) query.year = year;
    if (region) query.region = region;
    
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sortBy]: sortOrder };
    
    const gdpRecords = await GDP.find(query).sort(sortObj);
    
    res.json({
      success: true,
      count: gdpRecords.length,
      data: gdpRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching GDP records',
      error: error.message
    });
  }
});

// GET single GDP record by ID
router.get('/:id', async (req, res) => {
  try {
    const gdpRecord = await GDP.findById(req.params.id);
    
    if (!gdpRecord) {
      return res.status(404).json({
        success: false,
        message: 'GDP record not found'
      });
    }
    
    res.json({
      success: true,
      data: gdpRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching GDP record',
      error: error.message
    });
  }
});

// POST create new GDP record
router.post('/', async (req, res) => {
  try {
    const gdpRecord = new GDP(req.body);
    await gdpRecord.save();
    
    res.status(201).json({
      success: true,
      message: 'GDP record created successfully',
      data: gdpRecord
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'GDP record for this country and year already exists'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Error creating GDP record',
      error: error.message
    });
  }
});

// PUT update GDP record
router.put('/:id', async (req, res) => {
  try {
    const gdpRecord = await GDP.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!gdpRecord) {
      return res.status(404).json({
        success: false,
        message: 'GDP record not found'
      });
    }
    
    res.json({
      success: true,
      message: 'GDP record updated successfully',
      data: gdpRecord
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating GDP record',
      error: error.message
    });
  }
});

// DELETE GDP record
router.delete('/:id', async (req, res) => {
  try {
    const gdpRecord = await GDP.findByIdAndDelete(req.params.id);
    
    if (!gdpRecord) {
      return res.status(404).json({
        success: false,
        message: 'GDP record not found'
      });
    }
    
    res.json({
      success: true,
      message: 'GDP record deleted successfully',
      data: gdpRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting GDP record',
      error: error.message
    });
  }
});

// GET statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalRecords = await GDP.countDocuments();
    const countries = await GDP.distinct('country');
    const avgGDP = await GDP.aggregate([
      { $group: { _id: null, avg: { $avg: '$gdpInUSD' } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalRecords,
        totalCountries: countries.length,
        averageGDP: avgGDP[0]?.avg || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;