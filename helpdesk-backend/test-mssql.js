const db = require('./config/db');

async function testConnection() {
  try {
    console.log('Testing MSSQL connection...');
    const [rows] = await db.query('SELECT 1 AS test_val, @@VERSION AS version');
    console.log('Query Result:', rows);
    console.log('✅ Connection test successful!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    process.exit(1);
  }
}

testConnection();
