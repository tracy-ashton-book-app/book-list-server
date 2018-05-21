'use strict'

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT;

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

app.use(cors());

app.get('/', (req, res) => {
  res.send('<h1>Testing 1, 2, 3</h1>')
  console.log('Message sent.')
});

app.get('/test', (req, res) => {
  client.query('SELECT title FROM books;')
    .then(result => {
      console.log(result.rows);
      res.send(result.rows);
    })
    .catch(console.error);
})

app.get('*', (req, res) => res.status(403).send('This route does not exist'));

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));



//////// ** DATABASE LOADERS ** ////////
////////////////////////////////////////

function loadBooks() {
  let SQL = 'SELECT COUNT(*) FROM books';
  client.query( SQL )
    .then(result => {
      if(!parseInt(result.rows[0].count)) {
        fs.readFile('./data/books.json', 'utf8', (err, fd) => {
          debugger;
          JSON.parse(fd).forEach(ele => {
            let SQL = `
              INSERT INTO books (title, author, isbn, image_url, description)
              VALUES ($1, $2, $3, $4, $5)
            `;
            let values = [ele.title, ele.author, ele.isbn, ele.image_url, ele.description];
            client.query( SQL, values )
              .catch(console.error);
          })
        })
      }
    })
}

function loadDB() {

  client.query(`
    CREATE TABLE IF NOT EXISTS
    books (
      book_id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      isbn VARCHAR(255) NOT NULL,
      image_url VARCHAR(255),
      description TEXT NOT NULL
    );`
  )
    .then(loadBooks)
    .catch(console.error);
}

loadDB();