const User = require('../models/User');
const Order = require('../models/Order');

// @desc    Get all users with their total spent amount (For Dashboard)
exports.getUsers = async (req, res) => {
    try {
        // Fetch users and specifically include 'status'
        const users = await User.find({}).select('-password');
        
        const data = await Promise.all(users.map(async (user) => {
            // Find all PAID orders for this user
            const orders = await Order.find({ user: user._id, isPaid: true });
            const totalSpent = orders.reduce((acc, order) => acc + order.totalPrice, 0);
            
            return {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status || 'active', // Ensure status exists
                totalSpent: totalSpent || 0
            };
        }));

        res.status(200).json({ success: true, data });
    } catch (error) { 
        res.status(500).json({ success: false, message: error.message }); 
    }
};

// @desc    Update user status (Suspend/Block/Active)
exports.updateUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.status = req.body.status; 
            await user.save();
            res.json({ success: true, message: `Status updated to ${user.status}` });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Delete User
exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    User Profile methods (keep your existing ones below)
exports.getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    res.json(user);
};
exports.updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    if (req.body.name) user.name = req.body.name;
    if (req.body.password) user.password = req.body.password;
    await user.save();
    res.json({ success: true, name: user.name });
};