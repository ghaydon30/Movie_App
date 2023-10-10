// Same key used in the JWTStrategy (secret key for JWT)
const jwtSecret = 'your_jwt_secret';
const jwt = require('jsonwebtoken');
const passport = require('passport');

// Connects to local passport.js file
require('./passport.js');

let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        // Username we are encoding in the JWT
        subject: user.Username,
        // Specify the token will expire in 7 days
        expiresIn: '7d',
        // Algorithm used to "sign" or encode the values of the JWT
        algorithm: 'HS256'
    });
}

// Post login
module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local', { session: false }, (error, user, info) => {
            // Check if an error is thrown or if the username and password are not found in the database
            if (error || !user) {
                return res.status(400).json({
                    message: 'Something is not right',
                    user: user 
                });
            }
            req.login(user, { session: false }, (error) => {
                if (error) {
                    res.send(error);
                }
                let token = generateJWTToken(user.toJSON());
                return res.json({ user, token });
            });
        })(req, res);
    });
}