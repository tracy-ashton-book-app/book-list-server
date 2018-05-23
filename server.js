'use strict'

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

app.get('/', (req, res) => {
  res.send('<h1>Testing 1, 2, 3</h1>')
  console.log('Message sent.')
});

app.get('/api/v1/books', (req, res) => {
  client.query('SELECT book_id, title, author, image_url FROM books;')
    .then(result => {
      res.send(result.rows);
    })
    .catch(console.error);
})

app.get('/api/v1/books/:id', (req, res) => {
  let SQL = `SELECT book_id, isbn, description 
    FROM books
    WHERE book_id = $1;`
  let values = [req.params.id];
  client.query(SQL, values)
    .then(result => res.send(result.rows))
    .catch(console.error);
})

app.post('/api/v1/books', (req, res) => {
  let {title, author, isbn, image_url, description} = req.body;
  let SQL = 'INSERT INTO books (title, author, isbn, image_url, description) VALUES ($1, $2, $3, $4, $5)';
  let values = [title, author, isbn, image_url, description];
  client.query(SQL, values)
    .then (queryTwo(isbn))
    .catch (console.error);

  function queryTwo(isbn) {
    console.log('query two just fired', isbn);
    let SQL2 = `
      SELECT book_id
      FROM books
      WHERE isbn=$1
    ;`;
    let values = [isbn];
    client.query(SQL2, values)
      .then(result => {
        console.log('returned valeus from query 2: ', result.rows);
        res.send(result.rows);
      })
      .catch(console.error)
  }
});

app.get('*', (req, res) => {
  // console.log('server end point catchall reached',req.baseUrl,req.url);
  console.log(req.baseUrl);

  // res.redirect('http://www.google.com');
  // res.status(404).send('404 Error: Resource not found.');
});

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

//////// ** DATABASE LOADERS ** ////////
////////////////////////////////////////

function loadBooks() {
  let SQL = 'SELECT COUNT(*) FROM books';
  client.query( SQL )
    .then(result => {
      if(!parseInt(result.rows[0].count)) {
        fs.readFile('./data/books.json', 'utf8', (err, fd) => {
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
      isbn VARCHAR(255) NOT NULL UNIQUE,
      image_url VARCHAR(255),
      description TEXT NOT NULL
    );`
  )
    .then(loadBooks)
    .catch(console.error);
}

loadDB();