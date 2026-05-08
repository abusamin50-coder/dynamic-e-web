const express = require('express');
const router = express.Router();
const { toggleWishlist, getWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getWishlist).post(protect, toggleWishlist);

module.exports = router;