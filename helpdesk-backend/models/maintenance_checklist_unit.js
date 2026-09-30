const Sequelize = require('sequelize');
module.exports = (sequelize, DataTypes) => sequelize.define('maintenance_checklist_unit', {
  id_checklist_unit: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
  id_asset_type: { type: DataTypes.INTEGER, allowNull: false },
  nama_unit: { type: DataTypes.STRING(100), allowNull: false },
  urutan: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  created_at: { type: DataTypes.DATE, allowNull: true },
  updated_at: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'maintenance_checklist_unit', schema: 'project_sistem_magang_test', timestamps: false });
