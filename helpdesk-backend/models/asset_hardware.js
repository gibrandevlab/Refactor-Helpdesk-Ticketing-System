const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('asset_hardware', {
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
    komponen: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    spesifikasi: {
      type: DataTypes.STRING(255),
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
    tableName: 'asset_hardware',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "idx_hardware_kode",
        fields: [
          { name: "kode_asset" },
        ]
      },
      {
        name: "PK_asset_hardware_id",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
