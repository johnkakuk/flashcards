const mongoose = require('mongoose')

const cardSchema = new mongoose.Schema({
    front: {
        type: String,
        required: true
    },
    back: {
        type: String,
        required: true
    },
    lastShown: {
        type: Date,
        required: true,
        default: Date.now
    },
    showNext: {
        type: Date,
        required: true,
        default: Date.now
    },
    tag: {
        type: String,
    },
    created_at: {
        type: Date,
        required: true,
        default: Date.now
    }
})

module.exports = mongoose.model('Card', cardSchema)
