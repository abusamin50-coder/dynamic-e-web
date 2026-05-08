const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    image: {
        type: String,
        default: 'default-category.jpg'
    }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);