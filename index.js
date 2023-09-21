const express = require('express'),
    app = express(),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    uuid = require('uuid');

app.use(morgan('common'));
app.use(bodyParser.json());

// A movies array that users can use to gather information from and add to their favorites
let movies = [
    {
        "Title":"Gladiator",
        "Description":"A man robbed of his name and his dignity strives to win them back, and gain the freedom of his people, in this epic historical drama from director Ridley Scott. In the year 180, the death of emperor Marcus Aurelius (Richard Harris) throws the Roman Empire into chaos. Maximus (Russell Crowe) is one of the Roman army's most capable and trusted generals and a key advisor to the emperor. As Marcus' devious son Commodus (Joaquin Phoenix) ascends to the throne, Maximus is set to be executed. He escapes, but is captured by slave traders. Renamed Spaniard and forced to become a gladiator, Maximus must battle to the death with other men for the amusement of paying audiences. His battle skills serve him well, and he becomes one of the most famous and admired men to fight in the Colosseum. Determined to avenge himself against the man who took away his freedom and laid waste to his family, Maximus believes that he can use his fame and skill in the ring to avenge the loss of his family and former glory. As the gladiator begins to challenge his rule, Commodus decides to put his own fighting mettle to the test by squaring off with Maximus in a battle to the death. Gladiator also features Derek Jacobi, Connie Nielsen, Djimon Hounsou, and Oliver Reed, who died of a heart attack midway through production.",
        "Genre": {
            "Name":"Drama",
            "Description":"In film and television, drama is a category or genre of narrative fiction (or semi-fiction) intended to be more serious than humorous in tone."
        },
        "Director": {
            "Name":"Ridley Scott",
            "Bio":"Sir Ridley Scott is a British filmmaker. He is best known for directing films in the science fiction, crime, and historical drama genres. His work is known for its atmospheric and highly concentrated visual style.",
            "Birth":1937.0
        },
        "ImageURL":"https://m.media-amazon.com/images/I/61MSIFHAxML._AC_UF894,1000_QL80_.jpg",
        "Featured":false
    },
    {
        "Title":"Akira",
        "Description":"Clandestine army activities threaten the war torn city of Neo-Tokyo when a mysterious child with powerful psychic abilities escapes his prison and inadvertently draws a violent motorcycle gang into a heinous web of experimentation.",
        "Genre": {
            "Name":"Science Fiction",
            "Description":"Science fiction is a genre of speculative fiction, which typically deals with imaginative and futuristic concepts such as advanced science and technology."
        },
        "Director": {
            "Name":"Katsuhiro Otomo",
            "Bio":"Katsuhiro Otomo is a Japanese manga artist, screenwriter, animator and film director. He is best known as the creator of Akira, in terms of both the original 1982 manga series and the 1988 animated film adaptation.",
            "Birth":1954.0
        },
        "ImageURL":"https://m.media-amazon.com/images/I/91RdHa816XL._AC_UY218_.jpg",
        "Featured":false
    },
    {
        "Title":"Big Daddy",
        "Description":"An irresponsible law school graduate adopts a five-year-old boy.",
        "Genre": {
            "Name":"Comedy",
            "Description":"Comedy is a genre of fiction that consists of discourses or works intended to be humorous or amusing by inducing laughter, especially in theatre, film, stand-up comedy, television, radio, books, or any other entertainment medium."
        },
        "Director": {
            "Name":"Dennis Dugan",
            "Bio":"Dennis Barton Dugan (born September 5, 1946) is an American film director, actor, and comedian. He is known for his partnership with comedic actor Adam Sandler, for whom he directed the films Happy Gilmore, Big Daddy, The Benchwarmers, I Now Pronounce You Chuck & Larry, You Don't Mess with the Zohan, Grown Ups, Just Go with It, Jack and Jill and Grown Ups 2. Dugan is a four-time Golden Raspberry Award for Worst Director nominee, winning once.",
            "Birth":1946.0
        },
        "ImageURL":"https://m.media-amazon.com/images/I/91VUpW6FNjL._AC_UY218_.jpg",
        "Featured":false
    }
];

let users = [ 
    {
        "name":"Greg",
        "favoriteMovies":[],
        "id": 1
    },
    {
        "name":"Amy",
        "favoriteMovies":[
            "Big Daddy"
        ],
        "id": 2
    }
];

// Take general movies URL request and return a list of ALL movies to the user
// Movie list returned from the movies array and sent in JSON format
app.get('/movies', (req, res) => {
    res.status(200).json(movies);
});

/* Return data (description, genre, director, image URL, 
whether it’s featured or not) about a single movie by title to the user; */
// title becomes a property on the req.params object
app.get('/movies/:title', (req, res) => {
    // This definition is called object destructuring
    // variable title is set to the property of the same name on the object on the right
    const {title} = req.params;
    // When === is true, send value of movie into that variable
    const movie = movies.find(movie => movie.Title === title);
    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('Movie not found in database.');
    }
});

// Return data about a genre (description) by name/title (e.g., “Thriller”);
// genre gives another endpoint with data in genreName
app.get('/movies/genre/:genreName', (req, res) => {
    // variable genreName is set to the property of the same name on the object on the right
    const {genreName} = req.params;
    // === finds genre in list that is equal to the searched genre
    // last .Genre returns the Genre property of that movie object
    const genre = movies.find(movie => movie.Genre.Name === genreName).Genre;
    if (genre) {
        res.status(200).json(genre);
    } else {
        res.status(400).send('Genre not found in database.');
    }
});

// Return data of a director by name
app.get('/movies/directors/:directorName', (req, res) => {
    // same logic as above
    const {directorName} = req.params;
    // same logic as above
    const director = movies.find(movie => movie.Director.Name === directorName).Director;
    if (director) {
        res.status(200).json(director);
    } else {
        res.status(400).send('Director not found in database.');
    }
});

// CREATE - Allow new users to register
app.post('/users', (req, res) => {
    // Uses bodyParser middleware to read object provided in this request
    const newUser = req.body;

    if (newUser.name) {
        // newUser object, we can create a property on that object with dot notation
        newUser.id = uuid.v4();
        users.push(newUser);
        res.status(201).json(newUser);
    } else {
        res.status(400).send('Users need names.');
    }
});

// UPDATE - Allow users to update their user info (username)
app.put('/users/:id', (req, res) => {
    const {id} = req.params;
    // Uses bodyParser middleware to read object provided in this request
    const updatedUser = req.body;

    // let because if there is a user, we will give them the new updated user's name
    // Use == instead of === because we are comparing a number user.id to a string id
    let user = users.find(user => user.id == id);

    if (user) {
        user.name = updatedUser.name;
        res.status(200).json(user);
    } else {
        res.status(400).send('User not found.');
    }
});

// CREATE - Allow users to add a movie to their list of favorites (showing only a text that a movie has been added—more on this later);
app.put('/users/:id/:movieTitle', (req, res) => {
    const {id, movieTitle} = req.params;
    
    // Uses bodyParser middleware to read object provided in this request
    let user = users.find(user => user.id == id);

    if (user) {
        user.favoriteMovies.push(movieTitle);
        // Left over from Testing
        // res.status(200).json(user);
        res.status(200).send(`${movieTitle} has been added to the user ${id}'s array`);
    } else {
        res.status(400).send('User Not Found');
    }
});

// DELETE - Allow users to remove a movie from their list of favorites (showing only a text that a movie has been removed—more on this later);
app.delete('/users/:id/:movieTitle', (req, res) => {
    const {id, movieTitle} = req.params;
    
    // Uses bodyParser middleware to read object provided in this request
    let user = users.find(user => user.id == id);

    if (user) {
        // User filter method that takes a function as an argument
        // We essentially replace the array with one that does not have any movies matching movieTitle
        user.favoriteMovies = user.favoriteMovies.filter(title => title !== movieTitle);
        res.status(200).send(`${movieTitle} has been removed from the user ${id}'s array`);
    } else {
        res.status(400).send('User Not Found');
    }
});

// DELETE - Allow existing users to deregister (showing only a text that a user email has been removed—more on this later)
app.delete('/users/:id', (req, res) => {
    const {id} = req.params;
    
    // Uses bodyParser middleware to read object provided in this request
    let user = users.find(user => user.id == id);

    if (user) {
        // User filter method that takes a function as an argument
        // We essentially replace the array with one that does not have any movies matching movieTitle
        users = users.find(user => user.id != id);
        res.status(200).send(`User's ${id} has been deleted`);
    } else {
        res.status(400).send('User Not Found');
    }
});

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});