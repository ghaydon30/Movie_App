// Separate .js document for mongoose functionality to separate from index.js

// First we require the mongoose package
const mongoose = require('mongoose');

// Create a schema defining documents in the "Movies" collection
let movieSchema = mongoose.Schema({
    Title: {type: String, required: true},
    Description: {type: String, required: true},
    Genre: {
        Name: String,
        Description: String
    },
    Director: {
        Name: String,
        Bio: String
    },
    Actors: [String],
    ImagePath: String,
    Featured: Boolean
});

// Create a schema defining documents in the "Users" collection
let userSchema = mongoose.Schema({
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Birthday: Date,
    // FavoriteMovies is an array of references to movie documents by ObjectID
    FavoriteMovies: [{type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }]
});

// Create models to be used in index.html and enforce schema attributes created above
// These create collections called db.movies and db.users in "/data/db" directory
let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

// Export models for use in the "index.js" file
module.exports.Movie = Movie;
module.exports.User = User;