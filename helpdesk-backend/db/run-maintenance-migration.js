const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const sequelize = require('../config/sequelize');

async function run() {
  const migration = fs.readFileSync(path.join(__dirname, 'migrations', '20260929_maintenance_asset_types.sql'), 'utf8');
  try {
    await sequelize.authenticate();
    await sequelize.query(migration);
    console.log('Migrasi master maintenance berhasil dijalankan.');
  } finally {
    await sequelize.close();
  }
}

run().catch((error) => {
  console.error('Migrasi master maintenance gagal:', error.message);
  process.exitCode = 1;
});
