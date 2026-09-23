const db = require('./config/db');

async function setSaDefaultSchema() {
  try {
    console.log('Setting default schema for sa user...');
    await db.query('ALTER USER [sa] WITH DEFAULT_SCHEMA = [project_sistem_magang_test]');
    console.log('✅ Default schema set to project_sistem_magang_test for sa user!');

    // Test query without schema prefix
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
    console.log('QueryResult without schema prefix:', rows);
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

setSaDefaultSchema();
