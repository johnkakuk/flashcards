const express = require('express');
const Deck = require('../models/Deck')
const passport = require('passport');

const protectedRoute = passport.authenticate('jwt', { session: false })

const router = express.Router();

const getDeck = async (req, res, next) => {
    let deck
    try {
        deck = await Deck.findById(req.params.id)
        if (!deck) {
            return res.status(404).json({ message: "Deck not found" })
        }
    } catch(error) {
        return res.status(500).json({ message: error.message })
    }
    res.deck = deck;
    next();
}

// GET ALL
router.get('/', protectedRoute, async (req, res) => {
    try {
        const decks = await Deck.find()
        res.json(decks)
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
})



// GET ONE
router.get('/:id', protectedRoute, getDeck, async (req, res) => {
    res.json(res.deck)
})

// POST
router.post('/', protectedRoute, async (req, res) => {
    const deck = new Deck({
        name: req.body.name,
    })
    try {
        const newDeck = await deck.save();
        res.status(201).json(newDeck)
    } catch(error) {
        res.status(400).json({ message: error.message })
    }
})

// PATCH
router.patch('/:id', protectedRoute, getDeck, async (req, res) => {
    if(req.body.name != null) {
        res.deck.name = req.body.name
    }

    try {
        const updatedDeck = await res.deck.save()
        res.json(updatedDeck)
    } catch(error) {
        res.status(400).json({ message: error.message })
    }
})

// DELETE
router.delete('/:id', protectedRoute, getDeck, async (req, res) => {
    try {
        await res.deck.deleteOne();
        res.json({ message: "Removed deck" })
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
})

module.exports = router;
