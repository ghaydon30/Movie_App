const express = require('express');
const app = express();
const morgan = require('morgan');

app.use(morgan('common'));

let topMovies = [
    {
        title: 'Movie Title 1',
        author: 'Author 1'
    },
    {
        title: 'Movie Title 2',
        author: 'Author 2'
    },
    {
        title: 'Movie Title 3',
        author: 'Author 3'
    },
    {
        title: 'Movie Title 4',
        author: 'Author 4'
    },
    {
        title: 'Movie Title 5',
        author: 'Author 5'
    },
    {
        title: 'Movie Title 6',
        author: 'Author 6'
    },
    {
        title: 'Movie Title 7',
        author: 'Author 7'
    },
    {
        title: 'Movie Title 8',
        author: 'Author 8'
    },
    {
        title: 'Movie Title 9',
        author: 'Author 9'
    },
    {
        title: 'Movie Title 10',
        author: 'Author 10'
    }
];

app.get('/movies', (req, res) => {
    res.json(topMovies);
})

app.get('/', (req, res) => {
    res.send('Default Test Response');
});

app.use(express.static('public'));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});