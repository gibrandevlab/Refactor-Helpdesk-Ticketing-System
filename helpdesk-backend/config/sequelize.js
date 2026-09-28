const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mssql',
    define: {timestamps: false,      // Default: matikan createdAt & updatedAt untuk semua tabel
    freezeTableName: true,  // Default: gunakan nama tabel persis seperti di DB (tanpa pluralisasi)
    underscored: true       // Default: gunakan snake_case untuk kolom asing
    },
    dialectOptions: {
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === 'true'
      }
    },
    logging: false
  }
);

module.exports = sequelize;
