const express = require('express');
const router = express.Router();
const { 
    addOrderItems, 
    getMyOrders, 
    getOrderById, 
    getOrders, 
    updateOrderStatus 
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getOrders) // Admin sees all
    .post(protect, addOrderItems);

router.route('/myorders').get(protect, getMyOrders);

router.route('/:id').get(protect, getOrderById);

router.route('/:id/status').put(protect, admin, updateOrderStatus); // Admin updates status

module.exports = router;