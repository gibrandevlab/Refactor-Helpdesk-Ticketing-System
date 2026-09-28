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
      defaultValue: "(NTIDAK"
    },
    wms: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "(NTIDAK"
    },
    eris: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "(NTIDAK"
    },
    cmms: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "(NTIDAK"
    },
    visio: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "(NTIDAK"
    },
    autocad: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "(NTIDAK"
    },
    kaspersky: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "(NTIDAK"
    },
    ms_project: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "(NTIDAK"
    },
    acrobat: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: "(NTIDAK"
    }
  }, {
    sequelize,
    tableName: 'asset_software_detail',
    schema: 'project_sistem_magang_test',
    timestamps: true,
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
