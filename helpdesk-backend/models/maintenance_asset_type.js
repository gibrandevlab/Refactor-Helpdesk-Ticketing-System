const Sequelize = require('sequelize');
module.exports = (sequelize, DataTypes) => sequelize.define('maintenance_asset_type', {
  id_asset_type: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
  nama_jenis: { type: DataTypes.STRING(100), allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  created_at: { type: DataTypes.DATE, allowNull: true },
  updated_at: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'maintenance_asset_type', schema: 'project_sistem_magang_test', timestamps: false });
