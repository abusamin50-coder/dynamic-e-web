const express = require('express');
const router = express.Router();
const { 
    addOrderItems, 
    getMyOrders, 
    getOrderById, 
    getOrders, 
    updateOrderStatus,
    deleteOrder // এটি নতুন যোগ হয়েছে
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getOrders)
    .post(protect, addOrderItems);

router.route('/myorders').get(protect, getMyOrders);

router.route('/:id')
    .get(protect, getOrderById)
    .delete(protect, admin, deleteOrder); // ডিলিট রুট যোগ করা হলো

router.route('/:id/status').put(protect, admin, updateOrderStatus);

module.exports = router;