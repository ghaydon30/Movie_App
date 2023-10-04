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

// Allows mongoose to connect to myFlixDB to perform CRUD operations (final step of mongoDB / mongoose integration)
mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(morgan('common'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Following not required due to past 4.16 Express version
// app.use(bodyParser.json());

// Get all movies and return in a json format
app.get('/movies', async (req, res) => {
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
app.get('/movies/:Title', async (req, res) => {
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
app.get('/movies/genre/:Name', async (req, res) => {
    // findOne required a parameter to find a single instance of genre
    await Genres.findOne({ Name: req.params.Name })
        .then((genre) => {
            res.json(genre.Description);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

// Return data of a director by name
app.get('/movies/directors/:directorName', async (req, res) => {
    await Directors.findOne({ Name: req.params.Name })
        .then((director) => {
            res.json(director);
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
app.post('/users', async (req, res) => {
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
                    Password: req.body.Password,
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
app.put('/users/:id', async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {set:
    {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
    }
    },
    // Make sure updated document is returned
    { new: True}) 
    .then((updatedUser) => {
        res.json.apply(updatedUser);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    })
});

// Add a movie to a user's list of favorites
app.post('/users/:Username/Movies/:MovieID', async (req, res) => {
    await Users.findOneAndUpdate({ Username: req.params.Username }, {
        $push: { FavoriteMovies: req.params.MovieID }
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
app.delete('/users/:Username/movies/:MovieID', async (req, res) => {
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
app.delete('/users/:Username', async (req, res) => {
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

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});


// A movies array that users can use to gather information from and add to their favorites
/*
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
*/

/*
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
*/

// Non-required Text
// Movies
/*
var movie1 = {
    Title: "Akira",
    Description: "A secret military project endangers Neo-Tokyo when it turns a biker gang member into a rampaging psychic psychopath who can only be stopped by a teenager, his gang of biker friends and a group of psychics.",
    Genre: {
      Name: "Animation",
      Description: "Animation is the method that encompasses myriad filmmaking techniques, by which still images are manipulated to create moving images."
    },
    Director: {
      Name: "Katsuhiro Otomo",
      Bio: "Katsuhiro Otomo is a Japanese manga artist, screenwriter, animator and film director.",
      Birth: "1954",
    },
    ImagePath: "https://flxt.tmsimg.com/assets/p16852_p_v8_ad.jpg",
    Featured: false
}
var movie2 = {
    Title: "Steamboy",
    Description: "In 1860s Britain, a boy inventor finds himself caught in the middle of a deadly conflict over a revolutionary advance in steam power.",
    Genre: {
      Name: "Animation",
      Description: "Animation is the method that encompasses myriad filmmaking techniques, by which still images are manipulated to create moving images."
    },
    Director: {
      Name: "Katsuhiro Otomo",
      Bio: "Katsuhiro Otomo is a Japanese manga artist, screenwriter, animator and film director.",
      Birth: "1954",
    },
    ImagePath: "https://flxt.tmsimg.com/assets/p35910_v_v4_ae.jpg",
    Featured: true
}
var movie3 = {
    Title: "Chef",
    Description: "A head chef quits his restaurant job and buys a food truck in an effort to reclaim his creative promise, while piecing back together his estranged family.",
    Genre: {
      Name: "Comedy",
      Description: "Comedy is a genre of fiction that consists of discourses or works intended to be humorous or amusing by inducing laughter, especially in theatre, film, stand-up comedy, television, radio, books, or any other entertainment medium."
    },
    Director: {
      Name: "Jon Favreau",
      Bio: "Jonathan Kolia Favreau is an American actor and filmmaker.",
      Birth: "1966",
    },
    ImagePath: "https://flxt.tmsimg.com/assets/p10367270_p_v10_af.jpg",
    Featured: false
}
var movie4 = {
    Title: "Iron Man",
    Description: "After being held captive in an Afghan cave, billionaire engineer Tony Stark creates a unique weaponized suit of armor to fight evil.",
    Genre: {
      Name: "Action",
      Description: "Action film is a film genre in which the protagonist is thrust into a series of events that typically involve violence and physical feats."
    },
    Director: {
        Name: "Jon Favreau",
        Bio: "Jonathan Kolia Favreau is an American actor and filmmaker.",
        Birth: "1966",
    },
    ImagePath: "https://upload.wikimedia.org/wikipedia/en/0/02/Iron_Man_%282008_film%29_poster.jpg",
    Featured: false
}
var movie5 = {
    Title: "Elf",
    Description: "Raised as an oversized elf, Buddy travels from the North Pole to New York City to meet his biological father, Walter Hobbs, who doesn't know he exists and is in desperate need of some Christmas spirit.",
    Genre: {
        Name: "Comedy",
        Description: "Comedy is a genre of fiction that consists of discourses or works intended to be humorous or amusing by inducing laughter, especially in theatre, film, stand-up comedy, television, radio, books, or any other entertainment medium."
    },
    Director: {
        Name: "Jon Favreau",
        Bio: "Jonathan Kolia Favreau is an American actor and filmmaker.",
        Birth: "1966",
    },
    ImagePath: "https://flxt.tmsimg.com/assets/p32828_p_v7_as.jpg",
    Featured: false
}
var movie6 = {
    Title: "Interstellar",
    Description: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
    Genre: {
      Name: "Drama",
      Description: "In film and television, drama is a category or genre of narrative fiction (or semi-fiction) intended to be more serious than humorous in tone."
    },
    Director: {
      Name: "Christopher Nolan",
      Bio: "Best known for his cerebral, often nonlinear, storytelling, acclaimed writer-director Christopher Nolan has gone from low-budget independent films to working on some of the biggest blockbusters ever made.",
      Birth: "1970",
    },
    ImagePath: "https://flxt.tmsimg.com/assets/p10543523_p_v12_ar.jpg",
    Featured: false
}
var movie7 = {
    Title: "Inception",
    Description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team to disaster.",
    Genre: {
        Name: "Drama",
        Description: "In film and television, drama is a category or genre of narrative fiction (or semi-fiction) intended to be more serious than humorous in tone."
    },
    Director: {
        Name: "Christopher Nolan",
        Bio: "Best known for his cerebral, often nonlinear, storytelling, acclaimed writer-director Christopher Nolan has gone from low-budget independent films to working on some of the biggest blockbusters ever made.",
        Birth: "1970",
    },
    ImagePath: "https://flxt.tmsimg.com/assets/p7825626_p_v8_af.jpg",
    Featured: false
}
var movie8 = {
    Title: "Dunkirk",
    Description: "Allied soldiers from Belgium, the British Commonwealth and Empire, and France are surrounded by the German Army and evacuated during a fierce battle in World War II.",
    Genre: {
        Name: "Drama",
        Description: "In film and television, drama is a category or genre of narrative fiction (or semi-fiction) intended to be more serious than humorous in tone."
    },
    Director: {
        Name: "Christopher Nolan",
        Bio: "Best known for his cerebral, often nonlinear, storytelling, acclaimed writer-director Christopher Nolan has gone from low-budget independent films to working on some of the biggest blockbusters ever made.",
        Birth: "1970",
    },
    ImagePath: "https://resizing.flixster.com/Q8brnMSWFLzW9S2nPmfqAYdQRQg=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzL2I1MWE0NTljLTA3ODgtNDZkYy04NTcwLTgzMzg3ZjRmMzRhNC53ZWJw",
    Featured: false
}
var movie9 = {
    Title: "Silence of the Lambs",
    Description: "A young FBI cadet must receive the help of an incarcerated and manipulative cannibal killer to help catch another serial killer.",
    Genre: {
      Name: "Thriller",
      Description: "Thriller film, also known as suspense film or suspense thriller, is a broad film genre that involves excitement and suspense in the audience."
    },
    Director: {
        Name: "Jonathan Demme",
        Bio: "Robert Jonathan Demme was an American director, producer, and screenwriter.",
        Birth: "1944",
        Death: "2017"
    },
    ImagePath: "https://flxt.tmsimg.com/assets/p13013_p_v11_as.jpg",
    Featured: false
}
var movie10 = {
    Title: "Something Wild",
    Description: "A free-spirited woman kidnaps a yuppie for a weekend of adventure. But the fun quickly takes a dangerous turn when her ex-convict husband shows up.",
    Genre: {
        Name: "Comedy",
        Description: "Comedy is a genre of fiction that consists of discourses or works intended to be humorous or amusing by inducing laughter, especially in theatre, film, stand-up comedy, television, radio, books, or any other entertainment medium."
    },
    Director: {
      Name: "Jonathan Demme",
      Bio: "Robert Jonathan Demme was an American director, producer, and screenwriter.",
      Birth: "1944",
      Death: "2017"
    },
    ImagePath: "https://flxt.tmsimg.com/assets/p9602_p_v10_ah.jpg",
    Featured: false
}
*/

// Users
/*
db.users.insertOne(user)

var user1 = {
    UserName: "Edward Smith",
    Password: "Gcawefaj1!",
    Email: "edwardsmith@gmail.com",
    Birthday: new Date("1982-01-15"),
    FavMovies: [ObjectId("6514414d991c0de200323fc4"),ObjectId("65144c9a991c0de200323fc6")]
}
var user2 = {
    UserName: "John Doe",
    Password: "Jlfjsadfo?",
    Email: "johndoe@gmail.com",
    Birthday: new Date("2002-05-20"),
    FavMovies: [ObjectId("65144c9a991c0de200323fc6"),ObjectId("65144d2a991c0de200323fc8"),ObjectId("65144d48991c0de200323fcd")]
}
var user3 = {
    UserName: "Kelly Anderson",
    Password: "Ufadfuafrw!",
    Email: "kellyanderson@gmail.com",
    Birthday: new Date("1945-05-14"),
    FavMovies: [ObjectId("6514414d991c0de200323fc4"),ObjectId("65144d35991c0de200323fca")]
}
var user4 = {
    UserName: "Tony Pizzeria",
    Password: "Ofpoaiqwawtra?",
    Email: "tonypizzeria@gmail.com",
    Birthday: new Date("2000-08-26"),
    FavMovies: [ObjectId("65144cbf991c0de200323fc7"),ObjectId("65144d31991c0de200323fc9")]
}
var user5 = {
    UserName: "Two Chainz",
    Password: "Bsdf?dfafesw",
    Email: "chainzz@gmail.com",
    Birthday: new Date("1995-03-09"),
    FavMovies: [ObjectId("65144d2a991c0de200323fc8"),ObjectId("65144d3a991c0de200323fcb")]
}
var user6 = {
    UserName: "Sandy Hyatt",
    Password: "fskaldfsUU!",
    Email: "sandyhyatt@gmail.com",
    Birthday: new Date("1998-10-01"),
    FavMovies: [ObjectId("6514414d991c0de200323fc4"),ObjectId("65144d3a991c0de200323fcb")]
}
var user7 = {
    UserName: "Meghan Piazzo",
    Password: "dasfYw?faifr",
    Email: "meghanpiazzo@gmail.com",
    Birthday: new Date("2003-11-13"),
    FavMovies: [ObjectId("65144d31991c0de200323fc9"),ObjectId("65144d35991c0de200323fca")]
}
var user8 = {
    UserName: "Evelyn Newhouse",
    Password: "f7dar2lfaH",
    Email: "evelynnewhouse@gmail.com",
    Birthday: new Date("1999-07-24"),
    FavMovies: [ObjectId("65144cbf991c0de200323fc7"),ObjectId("65144d2a991c0de200323fc8")]
}
var user9 = {
    UserName: "Aaron Dubious",
    Password: "password",
    Email: "aarondubious@gmail.com",
    Birthday: new Date("1965-09-15"),
    FavMovies: [ObjectId("65144c9a991c0de200323fc6"),ObjectId("65144cbf991c0de200323fc7")]
}
var user10 = {
    UserName: "Howard Dean",
    Password: "HYAAAAAAAA!",
    Email: "howarddean@gmail.com",
    Birthday: new Date("1972-00-00"),
    FavMovies: [ObjectId("6514414d991c0de200323fc4"),ObjectId("65144d31991c0de200323fc9"),ObjectId("65144d44991c0de200323fcc")]
}

*/

// Movie IDs

/*
    1: ObjectId("6514414d991c0de200323fc4")
    2: ObjectId("65144c7c991c0de200323fc5")
    3: ObjectId("65144c9a991c0de200323fc6")
    4: ObjectId("65144cbf991c0de200323fc7")
    5: ObjectId("65144d2a991c0de200323fc8")
    6: ObjectId("65144d31991c0de200323fc9")
    7: ObjectId("65144d35991c0de200323fca")
    8: ObjectId("65144d3a991c0de200323fcb")
    9: ObjectId("65144d44991c0de200323fcc")
    10: ObjectId("65144d48991c0de200323fcd")
*/

// Database Updates

/*
db.movies.findOne( { _id: ObjectId("65144d2a991c0de200323fc8") })

db.movies.updateOne(
    { _id: ObjectId("65144d2a991c0de200323fc8") },
    { $set: { Description: "Buddy (Will Ferrell) was accidentally transported to the North Pole as a toddler and raised to adulthood among Santa's elves." } }
  )
db.movies.updateOne(
    { _id: ObjectId("65144c7c991c0de200323fc5") },
    { $set: { movieID: "2" } }
)
db.movies.updateOne(
    { _id: ObjectId("65144c9a991c0de200323fc6") },
    { $set: { movieID: "3" } }
)
db.movies.updateOne(
    { _id: ObjectId("65144cbf991c0de200323fc7") },
    { $set: { movieID: "4" } }
)
db.movies.updateOne(
    { _id: ObjectId("65144d2a991c0de200323fc8") },
    { $set: { movieID: "5" } }
)
db.movies.updateOne(
    { _id: ObjectId("65144d31991c0de200323fc9") },
    { $set: { movieID: "6" } }
)
db.movies.updateOne(
    { _id: ObjectId("65144d35991c0de200323fca") },
    { $set: { movieID: "7" } }
)
db.movies.updateOne(
    { _id: ObjectId("65144d3a991c0de200323fcb") },
    { $set: { movieID: "8" } }
)
db.movies.updateOne(
    { _id: ObjectId("65144d44991c0de200323fcc") },
    { $set: { movieID: "9" } }
)
db.movies.updateOne(
    { _id: ObjectId("65144d48991c0de200323fcd") },
    { $set: { movieID: "10" } }
)


db.movies.update( {"Director.Name": "Jon Favreau"}, { $set: {"Director.Bio": "Initially an indie film favorite, actor Jon Favreau has progressed to strong mainstream visibility into the millennium and, after nearly two decades in the business, is still enjoying character stardom as well as earning notice as a writer,producer,director."})

*/