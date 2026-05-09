const express = require('express');
const router = express.Router();
const { 
    getProducts, 
    getProductById, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    getRelatedProducts 
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * PRODUCT ROUTES
 */

// PUBLIC ROUTES
router.get('/', getProducts);
router.get('/related/:productId/:categoryId', getRelatedProducts);
router.get('/:id', getProductById);

// ADMIN ONLY ROUTES
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;