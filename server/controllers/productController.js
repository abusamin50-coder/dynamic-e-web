const Product = require('../models/Product');

/**
 * PRODUCT CONTROLLER - PROFESSIONAL VERSION
 */

// @desc    Get all products (With Search & Filter)
// @route   GET /api/products
exports.getProducts = async (req, res, next) => {
    try {
        const query = {};

        // 1. Search Logic
        if (req.query.keyword) {
            query.name = { $regex: req.query.keyword, $options: 'i' };
        }

        // 2. Category Filter
        if (req.query.category) {
            query.category = req.query.category;
        }

        const products = await Product.find(query).populate('category', 'name');

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) { next(error); }
};

// @desc    Get single product
// @route   GET /api/products/:id
exports.getProductById = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).populate('category', 'name');
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        
        res.status(200).json({ success: true, data: product });
    } catch (error) { next(error); }
};

// @desc    Create a product (With Image Upload)
// @route   POST /api/products
exports.createProduct = async (req, res, next) => {
    try {
        // Handle images from Multer
        if (req.files && req.files.length > 0) {
            req.body.images = req.files.map(file => `/uploads/${file.filename}`);
        } else {
            return res.status(400).json({ success: false, message: "Please upload at least one image" });
        }

        const product = await Product.create(req.body);
        res.status(201).json({ success: true, data: product });
    } catch (error) { next(error); }
};

// @desc    Update Product (FIXED: Smart Image Handling)
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
    try {
        let product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        // Logic: Only update images if the admin actually uploaded new files
        if (req.files && req.files.length > 0) {
            req.body.images = req.files.map(file => `/uploads/${file.filename}`);
        } else {
            // Remove images from req.body so Mongoose doesn't overwrite current ones with nothing
            delete req.body.images;
        }

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: product });
    } catch (error) { next(error); }
};

// @desc    Delete Product
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        
        await product.deleteOne();
        res.status(200).json({ success: true, message: 'Product removed' });
    } catch (error) { next(error); }
};

// @desc    Get related products (Same category, different ID)
// @route   GET /api/products/related/:productId/:categoryId
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