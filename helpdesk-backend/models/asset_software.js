const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('asset_software', {
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
    nama_software: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    versi: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    lisensi: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    tanggal_install: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    }
  }, {
    sequelize,
    tableName: 'asset_software',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "idx_software_kode",
        fields: [
          { name: "kode_asset" },
        ]
      },
      {
        name: "PK_asset_software_id",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
