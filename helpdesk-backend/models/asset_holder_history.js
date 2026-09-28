const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('asset_holder_history', {
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
    nik_lama: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    nama_lama: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    nik_baru: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    nama_baru: {
      type: DataTypes.STRING(150),
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
    tableName: 'asset_holder_history',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "kode_asset",
        fields: [
          { name: "kode_asset" },
        ]
      },
      {
        name: "PK_asset_holder_history_id",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
