# Movie_App
 App that provides information on movies from a database
 Allowed Origins: http://localhost:8080 & http://localhost:1234

## Movie Schema (json):
```
Title: {type: String},  
Description: {type: String},
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
MovieID: {type mongoose schema ObjectId}
```

## User Schema (json):
```
Username: {type: String},
Password: {type: String},
Email: {type: String},
Birthday: Date,
FavoriteMovies: [{type: mongoose schema ObjectId, ref: 'Movie' }]
```

## Get All Movies
Endpoint: /movies  
Method: GET  
Request Params: None  
Response:
- Status 201
- JSON response array of all movies following above schema
## Get Movie Info by Title
Endpoint: /movies/:Title  
Method: GET  
Request Params: `Title`  
Response: JSON response of one movie following above schema
## Get Genre Info by Name
Endpoint: /movies/genre/:Name  
Method: GET
Request Params: `Genre.Name`  
Response: JSON response of one genre following above schema
## Get Director Info by Name
Endpoint: /movies/directors/:Name  
Method: GET  
Request Params: `Director.Name`  
Response: JSON response of director info following above schema
## Create a User
Endpoint: /users  
Method: POST  
Request Body:  
```
Username: {type: String}, (required)
Password: {type: String}, (required)
Email: {type: String}, (required)
Birthday: Date
```
Response:  
- Status 201
- JSON response of user info following above schema
## Log in a User
Endpoint: /login  
Method: POST  
Request Body:  
```
Username: {type: String}, (required)
Password: {type: String}, (required)
```
Response:  
- Status 201
- JSON response of user info following above schema
## Update User Info
Endpoint: /users/:Username  
Method: PUT  
Request Body:  
```
Username: {type: String}, (required)
Password: {type: String}, (required)
Email: {type: String},
Birthday: Date
```
Response: JSON response of user info following above schema
## Add a Movie to User Favorites
Endpoint: /users/:Username/movies/:MovieID  
Method: POST  
Request Params: `MovieID`  
Response: JSON response of user info following above schema
## Remove a Movie from User Favorites
Endpoint: /users/:Username/movies/:MovieID  
Method: DELETE  
Request Params: `MovieID`  
Response: JSON response of user info following above schema
## Deregister a User
Endpoint: /users/:Username  
Method: DELETE  
Request Params: `Username`  
Response:  
- Status 200
- String response of username + " was deleted."