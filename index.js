const express = require('express');
const app = express();
const morgan = require('morgan');
// Following not required due to past 4.16 Express version
// const bodyParser = require('body-parser'),
const uuid = require('uuid');
// Require mongoose package and models.js file
const mongoose = require('mongoose');
const Models = require('./models.js');

// Models.Movie and Models.User refer to the model names defined in the “models.js” file
const Movies = Models.Movie;
const Users = Models.User;

// Import express validator for validation purposes
const { check, validationResult } = require('express-validator');

// Allows mongoose to connect to myFlixDB LOCALLY to perform CRUD operations (final step of mongoDB / mongoose integration)
// mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });

// Allows mongoose to connect to myFlixDB via Atlas server to perform CRUD operations (final step of mongoDB / mongoose integration)
mongoose.connect( process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(morgan('common'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Following not required due to past 4.16 Express version
// app.use(bodyParser.json());

const bcrypt = require("bcrypt")

// Add CORS to the app
const cors = require('cors');
// Code to specify which domains are allowed access to this API
let allowedOrigins = ['http://localhost:8080', 'http://testsite.com', 'http://localhost:1234', 'https://ghaydon-movieflix.netlify.app'];
app.use(cors( {
    origin: (origin, callback) => {
        if(!origin) return callback(null, true);
        // Check if a specific origin is not found in the allowed origin list
        if(allowedOrigins.indexOf(origin) === -1) {
            let message = 'The CORS policy for this application doesn\'t allow access from origin ' + origin;
            return callback(new WebTransportError(message ), false);
        }
        return callback(null, true);
    }
}));

// import auth.js file from repo, the (app) makes sure that express is available in auth.js as well
let auth = require('./auth.js')(app);

// require passport and import passport.js
const passport = require('passport');
require('./passport.js');

app.get('/', (req, res) => {
    res.send('Welcome to myFlix!')
});

// Get all movies and return in a json format
// use of async makes arrow functions asynchronous
// passport.authenticate will now check the required JWT token after decoding with the JWT authentication strategy
// RESTORE FOLLOWING LINE (AND DELETE NEXT AFTER THAT) WHEN REVERTING TO PRODUCTION VERSION
app.get('/movies', passport.authenticate('jwt', {session: false}), async (req, res) => {
    // Movies collection  
    await Movies.find()
        .then((movies) => {
            res.status(201).json(movies);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/* Return data (description, genre, director, image URL, 
whether it’s featured or not) about a single movie by title to the user; */
app.get('/movies/:Title', passport.authenticate('jwt', {session: false}), async (req, res) => {
    // findOne required a parameter to find a single movie
    await Movies.findOne({ Title: req.params.Title })
        .then((movie) => {
            res.json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Return data about a genre (description) by name/title (e.g., “Thriller”);
// genre gives another endpoint with data in genreName
app.get('/movies/genre/:Name', passport.authenticate('jwt', {session: false}), async (req, res) => {
    // findOne required a parameter to find a single instance of genre
    await Movies.findOne({ "Genre.Name": req.params.Name })
        .then((movie) => {
            res.json(movie.Genre);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Return data of a director by name
app.get('/movies/directors/:Name', passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Movies.findOne({ "Director.Name": req.params.Name })
        .then((movie) => {
            res.json(movie.Director);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// CREATE - Allow new users to register
/* We’ll expect JSON in this format
{
  ID: Integer,
  Username: String,
  Password: String,
  Email: String,
  Birthday: Date
}*/
app.post('/users', 
    // Validation logic for request, checks several pieces of the user input using validator
    // each of these checks a part of the HTTP req, and presents an error message string followed by the first comma
    [
        // Check to verify a username length greater than 5
        check('Username', 'Username is required').isLength({min: 5}),
        // Check if username contains alphanumeric characters
        check('Username', 'Username contains non alphanumeric characters - not allowed including spaces.').isAlphanumeric(),
        // .not().isEmpty() chains methods and means "is not empty"
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email does not appear to be valid').isEmail()
    ], async (req, res) => {
        // Error check for the validation object
        let errors = validationResult(req);
        // If there are errors, return them as a JSON object in an array format
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
    // Hash the password submitted in the req body
    let hashedPassword = Users.hashPassword(req.body.Password);
    // Use findOne command to check if existing user DOES exist
    // await waits for a promise and gets its fulfillment value, used inside an async function
    await Users.findOne({ Username: req.body.Username })
        .then((user) => {
            // if the user with the given username exists, returns error and username already exists as text
            if (user) {
                return res.status(400).send(req.body.Username + 'already exists');
            } else {
                // create command makes new user document with following keys and data
                Users.create({
                    Username: req.body.Username,
                    Password: hashedPassword,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday
                })
                // callback function with newly created user document amd successful status
                .then((user) => { res.status(201).json(user) })
                // catch for error when creating new user
                .catch((error) => {
                    console.error(error);
                    res.status(500).send('Error: ' + error);
                })
            }
        })
        // catches errors for the entire post command
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

// Update a user's info, by username
/* We’ll expect JSON in this format
{
  Username: String,
  (required)
  Password: String,
  (required)
  Email: String,
  (required)
  Birthday: Date
}*/
app.put('/users/:Username', 
    // Validation logic for request, checks several pieces of the user input using validator
    // each of these checks a part of the HTTP req, and presents an error message string followed by the first comma
    [
        // Check to verify a username length greater than 5
        check('Username', 'Username is required').isLength({min: 5}),
        // Check if username contains alphanumeric characters
        check('Username', 'Username contains non alphanumeric characters - not allowed including spaces.').isAlphanumeric(),
        // .not().isEmpty() chains methods and means "is not empty"
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email does not appear to be valid').isEmail()
    ], passport.authenticate('jwt', {session: false}), async (req, res) => {
        // Error check for the validation object
        let errors = validationResult(req);
        // If there are errors, return them as a JSON object in an array format
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
    }
    // Hash the password submitted in the req body
    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOneAndUpdate({ Username: req.params.Username }, {$set:
        {
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday
        }
    },
    // Make sure updated document is returned
    { new: true}) 
    .then((updatedUser) => {
        res.json(updatedUser);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Add a movie to a user's list of favorites
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Users.findOneAndUpdate(
        { Username: req.params.Username }, 
        {
            $push: { FavoriteMovies: req.params.MovieID },
        },
    { new: true}) // This line makes sure that the updated document is returned
    .then((updatedUser) => {
        res.json(updatedUser);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// DELETE - Allow users to remove a movie from their list of favorites (showing only a text that a movie has been removed—more on this later);
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
        $pull: { FavoriteMovies: req.params.MovieID }
    },
    { new: true}) // This line makes sure that the updated document is returned
    .then((updatedUser) => {
        res.json(updatedUser);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// DELETE - Allow existing users to deregister (showing only a text that a user email has been removed—more on this later)
// Delete a user by username
app.delete('/users/:Username', passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Users.findOneAndRemove({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
            res.status(400).send(req.params.Username + ' was not found');
            } else {
            res.status(200).send(req.params.Username + ' was deleted.');
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
    });
});

// Local port code
// app.listen(8080, () => {
//     console.log('Your app is listening on port 8080');
// });

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on port ' + port);
});