const express = require('express');
const router = express.Router();
const { addToCart, getCart, removeFromCart, updateCartQty } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getCart)
    .post(protect, addToCart)
    .put(protect, updateCartQty); // NEW

router.route('/:id').delete(protect, removeFromCart);

module.exports = router;