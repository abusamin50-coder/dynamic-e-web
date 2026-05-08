const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Add item to cart
exports.addToCart = async (req, res, next) => {
    try {
        const { productId, qty } = req.body;
        const quantity = Number(qty) || 1;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        let userCart = await Cart.findOne({ user: req.user._id });
        const item = { product: productId, name: product.name, image: product.images[0], price: product.price, qty: quantity };

        if (userCart) {
            const itemIndex = userCart.cartItems.findIndex(p => p.product.toString() === productId);
            if (itemIndex > -1) {
                userCart.cartItems[itemIndex].qty += quantity;
            } else {
                userCart.cartItems.push(item);
            }
            await userCart.save();
        } else {
            userCart = await Cart.create({ user: req.user._id, cartItems: [item] });
        }
        res.status(201).json({ success: true, cart: userCart });
    } catch (error) { next(error); }
};

// @desc    Update specific item quantity (NEW)
exports.updateCartQty = async (req, res, next) => {
    try {
        const { productId, qty } = req.body;
        const cart = await Cart.findOne({ user: req.user._id });
        if (cart) {
            const itemIndex = cart.cartItems.findIndex(p => p.product.toString() === productId);
            if (itemIndex > -1) {
                cart.cartItems[itemIndex].qty = Number(qty);
                if (cart.cartItems[itemIndex].qty <= 0) {
                    cart.cartItems = cart.cartItems.filter(p => p.product.toString() !== productId);
                }
                await cart.save();
                res.status(200).json({ success: true, cart });
            }
        }
    } catch (error) { next(error); }
};

exports.getCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        res.status(200).json(cart || { cartItems: [] });
    } catch (error) { next(error); }
};

exports.removeFromCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (cart) {
            cart.cartItems = cart.cartItems.filter(item => item.product.toString() !== req.params.id);
            await cart.save();
        }
        res.status(200).json({ success: true });
    } catch (error) { next(error); }
};