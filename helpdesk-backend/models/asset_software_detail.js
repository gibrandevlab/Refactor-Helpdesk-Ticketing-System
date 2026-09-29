const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('asset_software_detail', {
    kode_asset: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    operating_system: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    serial_no_os: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    ms_office: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    ms_office_sn: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    erp: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "TIDAK"
    },
    wms: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "TIDAK"
    },
    eris: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "TIDAK"
    },
    cmms: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "TIDAK"
    },
    visio: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "TIDAK"
    },
    autocad: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "TIDAK"
    },
    kaspersky: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "TIDAK"
    },
    ms_project: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "TIDAK"
    },
    acrobat: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "TIDAK"
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    }
  }, {
    sequelize,
    tableName: 'asset_software_detail',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "PK_asset_software_detail_kode_asset",
        unique: true,
        fields: [
          { name: "kode_asset" },
        ]
      },
    ]
  });
};
