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
        default: null
    },
    showNext: {
        type: Date,
        required: true,
        default: Date.now
    },
    deck: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Deck'
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
