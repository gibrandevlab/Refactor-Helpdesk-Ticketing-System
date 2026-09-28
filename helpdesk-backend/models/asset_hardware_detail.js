const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('asset_hardware_detail', {
    kode_asset: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    serial_no_pc: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    mobo_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    kelas: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    processor: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    hdd_size: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    hdd_model: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    hdd_serial_no: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    memory_size: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    memory_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    display: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'asset_hardware_detail',
    schema: 'project_sistem_magang_test',
    timestamps: true,
    indexes: [
      {
        name: "PK_asset_hardware_detail_kode_asset",
        unique: true,
        fields: [
          { name: "kode_asset" },
        ]
      },
    ]
  });
};
