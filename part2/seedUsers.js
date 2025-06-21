// seedUsers.js
const fs = require('fs');
const path = require('path');

async function seedUsersIfNeeded(pool) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM Users');
    if (rows[0].count === 0) {
      const seedSql = fs.readFileSync(path.join(__dirname, 'seed_users.sql'), 'utf8');
      await connection.query(seedSql);
      console.log('Seeded Users table with default data.');
    } else {
      console.log('Users table already has data. No seeding needed.');
    }
  } catch (err) {
    console.error('Error checking/seeding Users table:', err);
  } finally {
    connection.release();
  }
}

module.exports = seedUsersIfNeeded;