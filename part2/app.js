const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const pool = require('./models/db'); // use existing database pool

require('dotenv').config();

const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware
app.use(session({
  secret: 'dogwalksecretkey',
  resave: false,
  saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, '/public')));

// added login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const connection = await pool.getConnection();

    const [rows] = await connection.execute(
      'SELECT * FROM Users WHERE username = ? AND password_hash = ?',
      [username, password]
    );

    if (rows.length === 1) {
      req.session.user = rows[0];

      if (rows[0].role === 'owner') {
        res.redirect('/owner-dashboard.html');
      } else if (rows[0].role === 'walker') {
        res.redirect('/walker-dashboard.html');
      } else {
        res.status(403).send('Unknown role.');
      }
    } else {
      res.status(401).send('Invalid login credentials.');
    }

    connection.release();
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// added logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) return res.status(500).send('Logout failed');
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
  
module.exports = app;
