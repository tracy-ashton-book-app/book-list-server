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
  res.send('<h1>This is not the droid you seek</h1>')
  console.log('Message sent.')
});

app.get('/api/v1/books', (req, res) => {
  client.query('SELECT book_id, title, author, image_url FROM books;')
    .then(result => {
      console.log('someone just got some books!')
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

app.delete('/api/v1/books/:id', (req, res) => {
  let bookId = parseInt(req.params.id);
  console.log(`someone is trying to delete a book! #${bookId}`);
  if (!isNaN(bookId)) {
    let SQL = `
      DELETE FROM books
      WHERE book_id = $1
    ;`;
    let values = [bookId];
    client.query(SQL, values)
      .then(console.log(`successfully deleted that book, son! #: ${bookId}`))
      .then(res.status(204).send(`Book #${bookId} successfully deleted`))
      .catch(console.error);
  } else {
    res.send('YOU FOOL! That is not a valid book_id!');
  }
});

app.put('/api/v1/books/:id', (req, res) => {
  let bookId = parseInt(req.params.id);
  console.log(`here comes a put request!! its for book #${bookId}`);
  if (!isNaN(bookId)) {
    let SQL = `
      UPDATE books
      SET author=$1, title=$2, isbn=$3, image_url=$4, description=$5
      WHERE book_id=$6
    ;`;
    let values = [
      req.body.author,
      req.body.title,
      req.body.isbn,
      req.body.image_url,
      req.body.description,
      bookId
    ];
    client.query(SQL, values)
      .then(res.status(200).send(`Book #${bookId} successfully updated! Congratulations!`))
      .catch(console.error)
  } else {
    res.send('NOPE! That is not a valid book_id!');
  }
});

app.get('/api/v1/admin', (req, res) => {
  res.send(process.env.TOKEN)
});

app.post('/api/v1/books', (req, res) => {
  let { title, author, isbn, image_url, description } = req.body;
  let SQL = 'INSERT INTO books (title, author, isbn, image_url, description) VALUES ($1, $2, $3, $4, $5)';
  let values = [title, author, isbn, image_url, description];
  client.query(SQL, values)
    .then(queryTwo(isbn))
    .catch(console.error);

  function queryTwo(isbn) {
    let SQL2 = `
      SELECT book_id
      FROM books
      WHERE isbn=$1
    ;`;
    let values = [isbn];
    client.query(SQL2, values)
      .then(result => {
        res.send(result.rows);
      })
      .catch(console.error)
  }
});

app.get('*', (req, res) => {
  res.status(404).send('404 Error: Resource not found.');
});

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

//////// ** DATABASE LOADERS ** ////////
////////////////////////////////////////

function loadBooks() {
  let SQL = 'SELECT COUNT(*) FROM books';
  client.query(SQL)
    .then(result => {
      if (!parseInt(result.rows[0].count)) {
        fs.readFile('./data/books.json', 'utf8', (err, fd) => {
          JSON.parse(fd).forEach(ele => {
            let SQL = `
              INSERT INTO books (title, author, isbn, image_url, description)
              VALUES ($1, $2, $3, $4, $5)
            `;
            let values = [ele.title, ele.author, ele.isbn, ele.image_url, ele.description];
            client.query(SQL, values)
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