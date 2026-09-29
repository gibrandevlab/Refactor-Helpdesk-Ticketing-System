const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('checklist_approval', {
    id_ticket: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    dibuat_oleh_nik: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    tanggal_dibuat: {
      type: DataTypes.DATE,
      allowNull: true
    },
    diketahui_oleh_nik: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    tanggal_diketahui: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status_diketahui: {
      type: DataTypes.STRING(8),
      allowNull: false,
      defaultValue: "Menunggu"
    },
    catatan_diketahui: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    disetujui_oleh_nik: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    tanggal_disetujui: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status_disetujui: {
      type: DataTypes.STRING(8),
      allowNull: false,
      defaultValue: "Menunggu"
    },
    catatan_disetujui: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'checklist_approval',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "PK_checklist_approval_id_ticket",
        unique: true,
        fields: [
          { name: "id_ticket" },
        ]
      },
    ]
  });
};
