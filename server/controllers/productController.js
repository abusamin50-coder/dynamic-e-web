const Product = require('../models/Product');

/**
 * PRODUCT CONTROLLER - STABLE URL VERSION
 */

// 1. Get all products
exports.getProducts = async (req, res, next) => {
    try {
        const query = {};
        if (req.query.keyword) query.name = { $regex: req.query.keyword, $options: 'i' };
        if (req.query.category) query.category = req.query.category;

        const products = await Product.find(query).populate('category', 'name');
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) { next(error); }
};

// 2. Get single product
exports.getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).populate('category', 'name');
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.status(200).json({ success: true, data: product });
    } catch (error) { next(error); }
};

// 3. Create product (URL version)
exports.createProduct = async (req, res, next) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json({ success: true, data: product });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 4. Update product
exports.updateProduct = async (req, res, next) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!product) return res.status(404).json({ success: false, message: 'Not found' });
        res.status(200).json({ success: true, data: product });
    } catch (error) { next(error); }
};

// 5. Delete product
exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        await product.deleteOne();
        res.status(200).json({ success: true, message: 'Product removed' });
    } catch (error) { next(error); }
};

// 6. Get related products
exports.getRelatedProducts = async (req, res, next) => {
    try {
        const { productId, categoryId } = req.params;
        const related = await Product.find({ 
            category: categoryId, 
            _id: { $ne: productId } 
        }).limit(4);
        res.status(200).json({ success: true, data: related });
    } catch (error) { next(error); }
};