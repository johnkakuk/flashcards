const express = require('express');
const router = express.Router();
const passport = require('passport');
const passportService = require('../services/passport')

const requireLogin = passport.authenticate('local', { session: false })

const authentication_controller = require('../controllers/authentication_controller')

router.post('/signup', authentication_controller.signup)

router.post('/signin', requireLogin, authentication_controller.signin)

module.exports = router;
