const express = require('express');
const router = express.Router();
const {
  getLivestockStats,
  getVehicleStats,
  getUserStats
} = require('../controllers/statsController');

router.get('/livestock/stats', getLivestockStats);
router.get('/vehicles/stats', getVehicleStats);
router.get('/users/stats', getUserStats);

module.exports = router;