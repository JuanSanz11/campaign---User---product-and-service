const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const serviceRoutes = require('./serviceRoutes');
const campaignRoutes = require('./campaignRoutes');

const router = express.Router();

// Apply admin authentication to all admin routes
router.use(adminAuth);

// Mount existing resource routes under admin namespace
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/services', serviceRoutes);
router.use('/campaigns', campaignRoutes);

module.exports = router;
