const express = require('express');
const router = express.Router();
const { 
    getUsers, 
    updateUserStatus, 
    deleteUser, 
    getUserProfile, 
    updateUserProfile 
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// User Profile Routes
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// Admin User Management Routes
router.get('/', protect, admin, getUsers);
router.put('/:id/status', protect, admin, updateUserStatus);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;