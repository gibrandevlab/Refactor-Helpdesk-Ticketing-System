const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('schedule_asset_claim', {
    id_claim: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    id_schedule: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: "schedule_asset_claim$uniq_schedule_asset"
    },
    kode_asset: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "schedule_asset_claim$uniq_schedule_asset"
    },
    id_teknisi: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    id_ticket: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    claimed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    }
  }, {
    sequelize,
    tableName: 'schedule_asset_claim',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "PK_schedule_asset_claim_id_claim",
        unique: true,
        fields: [
          { name: "id_claim" },
        ]
      },
      {
        name: "schedule_asset_claim$uniq_schedule_asset",
        unique: true,
        fields: [
          { name: "id_schedule" },
          { name: "kode_asset" },
        ]
      },
    ]
  });
};
