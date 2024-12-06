const express = require('express'); // for creating a web server and handling routing
const cors = require('cors'); // for allowing requests from other origins
require('dotenv').config(); // loads environment variables

// import Routes
const authRoutes = require('./routes/auth'); // auth routes
const userRoutes = require('./routes/user'); // user routes
const movieRoutes = require('./routes/movie.js'); // movie routes

const app = express(); // app - instance of Express application, used to define routes and middleware

// middleware
app.use(cors()); // enables CORS
app.use(express.json()); // parses JSON request bodies

app.use('/api/v1', authRoutes); // auth routes
app.use('/api/v1/user', userRoutes); // user routes
app.use('/api/v1/movie', movieRoutes); // movie routes

// base route
app.get('/', (req, res) => {
    res.send('Welcome to the Movie Library API!');
});

// start the Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});