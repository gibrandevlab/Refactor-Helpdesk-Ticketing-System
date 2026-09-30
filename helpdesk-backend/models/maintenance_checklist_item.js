const Sequelize = require('sequelize');
module.exports = (sequelize, DataTypes) => sequelize.define('maintenance_checklist_item', {
  id_maintenance_item: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
  id_asset_type: { type: DataTypes.INTEGER, allowNull: false },
  id_checklist_unit: { type: DataTypes.INTEGER, allowNull: true },
  uraian_pemeriksaan: { type: DataTypes.STRING(255), allowNull: false },
  alat_metode: { type: DataTypes.STRING(255), allowNull: true },
  kriteria_hasil: { type: DataTypes.STRING(255), allowNull: true },
  urutan: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  created_at: { type: DataTypes.DATE, allowNull: true },
  updated_at: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'maintenance_checklist_item', schema: 'project_sistem_magang_test', timestamps: false });
