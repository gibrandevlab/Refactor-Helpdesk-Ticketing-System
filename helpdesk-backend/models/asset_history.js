const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('asset_history', {
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
    tanggal: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    jenis_aktivitas: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dilakukan_oleh: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    }
  }, {
    sequelize,
    tableName: 'asset_history',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "idx_history_kode",
        fields: [
          { name: "kode_asset" },
        ]
      },
      {
        name: "PK_asset_history_id",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
