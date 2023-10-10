const passport = require('passport');
// LocalStrategy defines basic HTTP auth. with username and password
const LocalStrategy = require('passport-local').Strategy;
const Models = require('./models.js');
const passportJWT = require('passport-jwt');

let Users = Models.User;
let JWTStrategy = passportJWT.Strategy;
let ExtractJWT = passportJWT.ExtractJwt;

// HTTP authentication for login requests
// Use passport as middleware
passport.use(
    // New instance of LocalStrategy object created with properties username and password
    new LocalStrategy(
        {
            usernameField: 'Username',
            passwordField: 'Password',
        }, 
        // Arrow function given strings username, password, and parameter callback to return errors
        async (username, password, callback) => {
            // Use template literals ${} to put together string variables
            console.log(`${username} ${password}`);
            // Find username from our database using Mongoose
            await Users.findOne({ Username: username })
            .then((user) => {
                if (!user) {
                    console.log('incorrect username');
                    return callback(null, false, {
                        message: 'Incorrect username or password.',
                    });
                }
                console.log('finished');
                return callback(null, user);
            })
            .catch((error) => {
                if (error) {
                    console.log(error);
                    return callback(error);
                }
            })
        }   
    )
);

// Passport strategy for authenticating using JWT Tokens
passport.use(new JWTStrategy( {
    // The JWT is taken from the header of the HTTP request
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    // Secret key used to verify the signature of the JWT
    secretOrKey: 'your_jwt_secret'
}, async (jwtPayload, callback) => {
    return await Users.findById(jwtPayload._id)
        .then((user) => {
            return callback(null, user);
        })
        .catch((error) => {
            return callback(error)
        });
}));