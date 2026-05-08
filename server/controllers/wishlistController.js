const Wishlist = require('../models/Wishlist');

exports.toggleWishlist = async (req, res, next) => {
    try {
        const { productId } = req.body;
        let wishlist = await Wishlist.findOne({ user: req.user._id });

        if (!wishlist) {
            wishlist = await Wishlist.create({ user: req.user._id, products: [productId] });
        } else {
            const isAdded = wishlist.products.includes(productId);
            if (isAdded) {
                wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
            } else {
                wishlist.products.push(productId);
            }
            await wishlist.save();
        }
        res.status(200).json({ success: true, count: wishlist.products.length });
    } catch (error) { next(error); }
};

exports.getWishlist = async (req, res, next) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user._id });
        res.status(200).json({ success: true, count: wishlist ? wishlist.products.length : 0 });
    } catch (error) { next(error); }
};