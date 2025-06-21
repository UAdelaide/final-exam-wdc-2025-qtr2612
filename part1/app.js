const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db;

(async () => {
  try {
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });
    console.log('Connected to DogWalkService');

    const [users] = await db.execute('SELECT COUNT(*) AS count FROM Users');
    if (users[0].count === 0) {
      console.log('Seeding database...');

      await db.execute(`
        INSERT INTO Users (username, email, password_hash, role) VALUES
        ('alice123', 'alice@example.com', 'hashed123', 'owner'),
        ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
        ('carol123', 'carol@example.com', 'hashed789', 'owner'),
        ('davidowner', 'david@example.com', 'hashed000', 'owner'),
        ('evewalker', 'eve@example.com', 'hashed999', 'walker')
      `);

      await db.execute(`
        INSERT INTO Dogs (owner_id, name, size) VALUES
        ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
        ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
        ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Rocky', 'large'),
        ((SELECT user_id FROM Users WHERE username = 'davidowner'), 'Coco', 'medium'),
        ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Luna', 'small')
      `);

      await db.execute(`
        INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
        ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Rocky'), '2025-06-11 10:00:00', 60, 'Riverbank Trail', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Coco'), '2025-06-12 11:00:00', 30, 'City Gardens', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Luna'), '2025-06-13 12:30:00', 40, 'North Hills', 'cancelled')
      `);

      await db.execute(`
        INSERT INTO WalkApplications (request_id, walker_id, status) VALUES
        (2, (SELECT user_id FROM Users WHERE username = 'bobwalker'), 'accepted'),
        (3, (SELECT user_id FROM Users WHERE username = 'bobwalker'), 'accepted')
      `);

      await db.execute(`
        UPDATE WalkRequests SET status = 'completed' WHERE request_id IN (2, 3)
      `);

      await db.execute(`
        INSERT INTO WalkRatings (request_id, walker_id, owner_id, rating, comments) VALUES
        (
          2,
          (SELECT user_id FROM Users WHERE username = 'bobwalker'),
          (SELECT u.user_id FROM Users u JOIN Dogs d ON d.owner_id = u.user_id JOIN WalkRequests wr ON wr.dog_id = d.dog_id WHERE wr.request_id = 2),
          5, 'Great job'
        ),
        (
          3,
          (SELECT user_id FROM Users WHERE username = 'bobwalker'),
          (SELECT u.user_id FROM Users u JOIN Dogs d ON d.owner_id = u.user_id_
