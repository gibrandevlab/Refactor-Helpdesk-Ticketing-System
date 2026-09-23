const db = require('./config/db');

async function testLoginQuery() {
  try {
    console.log('Testing login query on SQL Server...');
    const username = 'K0003';
    const [rows] = await db.query(
      `SELECT u.id_user, u.username, u.password, u.level, u.status,
              k.nik, k.nama, k.id_departemen, d.nama_departemen
       FROM user u
       JOIN karyawan k ON k.nik = u.nik
       LEFT JOIN departemen d ON d.id_departemen = k.id_departemen
       WHERE u.username = ?`,
      [username]
    );
    console.log('QueryResult:', rows);
    console.log('✅ Login query executed successfully on SQL Server!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Login query failed:', err.message);
    process.exit(1);
  }
}

testLoginQuery();
