const express = require('express');
const Card = require('../models/Card')
const passport = require('passport');
const protectedRoute = passport.authenticate('jwt', { session: false })

const router = express.Router();

const getCard = async (req, res, next) => {
    let card
    try {
        card = await Card.findById(req.params.id)
        if (!card) {
            return res.status(404).json({ message: "Card not found" })
        }
    } catch(error) {
        return res.status(500).json({ message: error.message })
    }
    res.card = card;
    next();
}

// GET ALL
router.get('/', protectedRoute, async (req, res) => {
    try {
        const filter = {}
        if(req.query.deck) {
            filter.deck = req.query.deck
        }
        const cards = await Card.find(filter)
        res.json(cards)
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
})

// GET ONE
router.get('/:id', protectedRoute, getCard, async (req, res) => {
    res.json(res.card)
})

// POST
router.post('/', protectedRoute, async (req, res) => {
    const card = new Card({
        front: req.body.front,
        back: req.body.back,
        showNext: req.body.showNext || Date.now(),
        lastShown: req.body.lastShown || null,
        tag: req.body.tag,
        deck: req.body.deck || null
    })
    try {
        const newCard = await card.save();
        res.status(201).json(newCard)
    } catch(error) {
        res.status(400).json({ message: error.message })
    }
})

// PATCH
router.patch('/:id', protectedRoute, getCard, async (req, res) => {
    if(req.body.front != null) {
        res.card.front = req.body.front
    }

    if(req.body.back != null) {
        res.card.back = req.body.back
    }

    if(req.body.showNext != null) {
        res.card.showNext = req.body.showNext
    }

    if(req.body.lastShown != null) {
        res.card.lastShown = req.body.lastShown
    }

    if(req.body.tag != null) {
        res.card.tag = req.body.tag
    }

    if(req.body.deck != null) {
        res.card.deck = req.body.deck
    }

    try {
        const updatedCard = await res.card.save()
        res.json(updatedCard)
    } catch(error) {
        res.status(400).json({ message: error.message })
    }
})

// DELETE
router.delete('/:id', protectedRoute, getCard, async (req, res) => {
    try {
        await res.card.deleteOne();
        res.json({ message: "Removed card" })
    } catch(error) {
        res.status(500).json({ message: error.message })
    }
})

module.exports = router;
