const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        default: 0
    },
    brand: {
        type: String,
        required: [true, 'Brand is required']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    countInStock: {
        type: Number,
        required: [true, 'Stock count is required'],
        default: 0
    },
    images: {
        type: [String],
        required: [true, 'At least one image is required']
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);