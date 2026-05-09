const Product = require('../models/Product');

// @desc    Get all products
exports.getProducts = async (req, res, next) => {
    try {
        const query = {};
        if (req.query.keyword) query.name = { $regex: req.query.keyword, $options: 'i' };
        if (req.query.category) query.category = req.query.category;

        const products = await Product.find(query).populate('category', 'name');
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) { next(error); }
};

// @desc    Create product (JSON URL version)
exports.createProduct = async (req, res, next) => {
    try {
        // req.body.images should be an array of URLs from the frontend
        const product = await Product.create(req.body);
        res.status(201).json({ success: true, data: product });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update product
exports.updateProduct = async (req, res, next) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({ success: true, data: product });
    } catch (error) { next(error); }
};

// @desc    Delete product
exports.deleteProduct = async (req, res, next) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true });
    } catch (error) { next(error); }
};

// @desc    Get single product
exports.getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).populate('category', 'name');
        res.status(200).json({ success: true, data: product });
    } catch (error) { next(error); }
};