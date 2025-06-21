const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const dbConfig = require('./bin/db');

require('dotenv').config();
const app = express();

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));

// Session setup
app.use(session({
    secret: 'dogwalksecretkey',
    resave: false,
    saveUninitialized: true
  }));

  // Login endpoint
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute(
        'SELECT * FROM Users WHERE username = ? AND password_hash = ?',
        [username, password]
      );

      if (rows.length === 1) {
        req.session.user = rows[0];

        // Redirect user based on role
        if (rows[0].role === 'owner') {
          res.redirect('/owner-dashboard.html');
        } else if (rows[0].role === 'walker') {
          res.redirect('/walker-dashboard.html');
        } else {
          res.status(403).send('Unknown role.');
        }
      } else {
        res.status(401).send('Invalid credentials');
      }

      await connection.end();
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });


// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;