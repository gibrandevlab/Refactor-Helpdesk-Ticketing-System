const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('asset_department_history', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    kode_asset: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    id_departemen_lama: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    nama_departemen_lama: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    id_departemen_baru: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    nama_departemen_baru: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    keterangan: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    tanggal_pindah: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    }
  }, {
    sequelize,
    tableName: 'asset_department_history',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "idx_asset_department_history_kode",
        fields: [
          { name: "kode_asset" },
        ]
      },
      {
        name: "PK_asset_department_history_id",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
