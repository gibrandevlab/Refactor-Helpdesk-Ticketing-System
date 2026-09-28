const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ticket_checklist_result', {
    id_result: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    id_ticket: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "ticket_checklist_result$uniq_ticket_item"
    },
    id_item: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'checklist_template',
        key: 'id_item'
      },
      unique: "ticket_checklist_result$uniq_ticket_item"
    },
    kondisi: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    kondisi_huruf: {
      type: DataTypes.STRING(1),
      allowNull: true
    },
    catatan: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    checked_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'ticket_checklist_result',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "id_item",
        fields: [
          { name: "id_item" },
        ]
      },
      {
        name: "PK_ticket_checklist_result_id_result",
        unique: true,
        fields: [
          { name: "id_result" },
        ]
      },
      {
        name: "ticket_checklist_result$uniq_ticket_item",
        unique: true,
        fields: [
          { name: "id_ticket" },
          { name: "id_item" },
        ]
      },
    ]
  });
};
