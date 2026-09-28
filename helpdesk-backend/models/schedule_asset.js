const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('schedule_asset', {
    id_schedule: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'preventive_schedule',
        key: 'id_schedule'
      }
    },
    kode_asset: {
      type: DataTypes.STRING(15),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'inventory',
        key: 'kode_asset'
      }
    }
  }, {
    sequelize,
    tableName: 'schedule_asset',
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
        name: "PK_schedule_asset_id_schedule",
        unique: true,
        fields: [
          { name: "id_schedule" },
          { name: "kode_asset" },
        ]
      },
    ]
  });
};
