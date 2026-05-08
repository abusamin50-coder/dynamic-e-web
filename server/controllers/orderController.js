const Order = require('../models/Order');
const Cart = require('../models/Cart');

// @desc    Create new order
exports.addOrderItems = async (req, res, next) => {
    try {
        const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;
        if (orderItems && orderItems.length === 0) return res.status(400).json({ message: 'No order items' });

        const order = new Order({
            user: req.user._id,
            orderItems,
            shippingAddress,
            paymentMethod,
            totalPrice
        });

        const createdOrder = await order.save();
        await Cart.findOneAndDelete({ user: req.user._id });
        res.status(201).json({ success: true, data: createdOrder });
    } catch (error) { next(error); }
};

// @desc    Get logged in user orders
exports.getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
        res.status(200).json({ success: true, data: orders });
    } catch (error) { next(error); }
};

// @desc    Get order by ID
exports.getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        if (order) res.json({ success: true, data: order });
        else res.status(404).json({ message: 'Order not found' });
    } catch (error) { next(error); }
};

// --- ADMIN ONLY FUNCTIONS ---

// @desc    Get all orders
// @route   GET /api/orders
exports.getOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({}).populate('user', 'id name').sort('-createdAt');
        res.json({ success: true, data: orders });
    } catch (error) { next(error); }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.status = req.body.status || order.status;
            
            // If marked as Delivered, we assume payment is collected (for Cash on Delivery)
            if (order.status === 'Delivered') {
                order.isPaid = true;
                order.paidAt = Date.now();
            }

            const updatedOrder = await order.save();
            res.json({ success: true, data: updatedOrder });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) { next(error); }
};