const express = require('express'); // for creating a web server and handling routing
const cors = require('cors'); // for allowing requests from other origins
require('dotenv').config(); // loads environment variables

// import Routes
const authRoutes = require('./routes/auth'); // auth routes
const userRoutes = require('./routes/user'); // user routes
const movieRoutes = require('./routes/movie.js'); // movie routes
const ratingRoutes = require('./routes/review.js'); // rating routes
//const roleRoutes = require('./routes/role.js'); // role routes
const genreRoutes = require('./routes/genre.js'); // genre routes
const personRoutes = require('./routes/person.js'); // person routes
const directorRoutes = require('./routes/director.js'); // director routes

const app = express(); // app - instance of Express application, used to define routes and middleware

// middleware
app.use(cors()); // enables CORS
app.use(express.json()); // parses JSON request bodies

// routes
app.use('/api/v1', authRoutes); // auth routes,
app.use('/api/v1/user', userRoutes); // user routes
app.use('/api/v1/movie', movieRoutes); // movie routes
app.use('/api/v1/rating', ratingRoutes); // rating routes
//app.use('/api/v1/role', roleRoutes); // role routes
app.use('/api/v1/genre', genreRoutes); // genre routes
app.use('/api/v1/person', personRoutes); // person routes
app.use('/api/v1/director', directorRoutes); // director routes

// base route
app.get('/', (req, res) => {
    res.send('Welcome to the Movie Library API!');
});

// start the Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});