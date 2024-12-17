const express = require('express'); // for creating a web server and handling routing
const cors = require('cors'); // for allowing requests from other origins
require('dotenv').config(); // loads environment variables

// import Routes
const authRoutes = require('./routes/auth.js'); // auth routes
const castRoutes = require('./routes/cast.js'); // cast routes
const directorRoutes = require('./routes/director.js'); // director routes
const genreRoutes = require('./routes/genre.js'); // genre routes
const movieRoutes = require('./routes/movie.js'); // movie routes
const personRoutes = require('./routes/person.js'); // person routes
const reviewRoutes = require('./routes/review.js'); // review routes
const scoreRoutes = require('./routes/score.js'); // score routes
const userRoutes = require('./routes/user.js'); // user routes

const { removeListener } = require('./config/db.js');

const app = express(); // app - instance of Express application, used to define routes and middleware

// middleware
app.use(cors()); // enables CORS
app.use(express.json()); // parses JSON request bodies

// routes
app.use('/api/v1', authRoutes);,
app.use('/api/v1/cast', castRoutes);
app.use('/api/v1/director', directorRoutes);
app.use('/api/v1/genre', genreRoutes);
//app.use('/api/v1/movie', movieRoutes);
app.use('/api/v1/person', personRoutes);
app.use('/api/v1/review', reviewRoutes);
app.use('/api/v1/score', scoreRoutes);
app.use('/api/v1/user', userRoutes);

// base route
app.get('/', (req, res) => {
    res.send('Welcome to the Movie Library API!');
});

// start the Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});