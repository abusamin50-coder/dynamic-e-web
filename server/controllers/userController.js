const User = require('../models/User');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs'); // Needed for manual hashing

// @desc    Get user profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile (FIXED: Manual Hashing for 100% Reliability)
exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, password } = req.body;

        // --- SCENARIO 1: PASSWORD UPDATE ---
        if (password && password.trim() !== "") {
            // Manual Hashing
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { password: hashedPassword },
                { new: true }
            );

            return res.json({
                success: true,
                message: "Security password updated!",
                name: updatedUser.name
            });
        }

        // --- SCENARIO 2: NAME UPDATE ---
        if (name) {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { name: name },
                { new: true, runValidators: true }
            );

            return res.json({
                success: true,
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                message: "Name updated successfully"
            });
        }

        res.status(400).json({ message: "No data provided" });

    } catch (error) {
        console.error("Update Error:", error.message);
        res.status(400).json({ success: false, message: error.message });
    }
};

// --- ADMIN FUNCTIONS ---
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        const usersWithSpent = await Promise.all(users.map(async (user) => {
            let totalSpent = 0;
            try {
                const orders = await Order.find({ user: user._id, isPaid: true });
                totalSpent = orders.reduce((acc, order) => acc + order.totalPrice, 0);
            } catch (e) { totalSpent = 0; }
            return { ...user._doc, totalSpent };
        }));
        res.status(200).json({ success: true, data: usersWithSpent });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) { user.status = req.body.status; await user.save(); res.json({ success: true }); }
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ message: error.message }); }
};