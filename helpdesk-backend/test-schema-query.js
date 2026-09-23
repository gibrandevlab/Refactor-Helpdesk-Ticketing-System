const db = require('./config/db');

async function testSchemaQuery() {
  try {
    console.log('Testing schema query on SQL Server...');
    const username = 'K0003';
    const [rows] = await db.query(
      `SELECT u.id_user, u.username, u.password, u.level, u.status,
              k.nik, k.nama, k.id_departemen, d.nama_departemen
       FROM project_sistem_magang_test.[user] u
       JOIN project_sistem_magang_test.karyawan k ON k.nik = u.nik
       LEFT JOIN project_sistem_magang_test.departemen d ON d.id_departemen = k.id_departemen
       WHERE u.username = ?`,
      [username]
    );
    console.log('QueryResult:', rows);
    console.log('✅ Query with schema prefix executed successfully on SQL Server!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Query failed:', err.message);
    process.exit(1);
  }
}

testSchemaQuery();
