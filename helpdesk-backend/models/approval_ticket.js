const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('approval_ticket', {
    id_approval: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    id_ticket: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: 'list_ticket',
        key: 'id_ticket'
      },
      unique: "approval_ticket$id_ticket"
    },
    nik_admin: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'karyawan',
        key: 'nik'
      }
    },
    tanggal_approval: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status_approval: {
      type: DataTypes.STRING(17),
      allowNull: false,
      defaultValue: "Menunggu Approval"
    },
    catatan_approval: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'approval_ticket',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "approval_ticket$id_ticket",
        unique: true,
        fields: [
          { name: "id_ticket" },
        ]
      },
      {
        name: "nik_admin",
        fields: [
          { name: "nik_admin" },
        ]
      },
      {
        name: "PK_approval_ticket_id_approval",
        unique: true,
        fields: [
          { name: "id_approval" },
        ]
      },
    ]
  });
};
