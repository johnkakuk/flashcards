const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const passport = require('passport');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8000;

const cardRouter = require('./routes/cards')
const deckRouter = require('./routes/decks')
const authRouter = require('./routes/auth')
require('./services/passport')

const DATABASE_URL = process.env.DATABASE_URL;

mongoose.connect(DATABASE_URL, { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', error => console.error(error));
db.once('open', () => console.log("Database Connection Established"))

app.use(express.json())
app.use(passport.initialize())
app.use('/api/v1/cards', cardRouter)
app.use('/api/v1/decks', deckRouter)
app.use('/api/v1/auth', authRouter)

// Look for static build
app.use(express.static(path.join(__dirname, '../reactjs/build')));

// For any routes not defined by API, assume direct request to client-side route
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, '../reactjs/build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
})
