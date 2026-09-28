const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('assignment_ticket', {
    id_assignment: {
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
      unique: "assignment_ticket$id_ticket"
    },
    id_teknisi: {
      type: DataTypes.STRING(15),
      allowNull: false,
      references: {
        model: 'teknisi',
        key: 'id_teknisi'
      }
    },
    tanggal_assign: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    },
    progress: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 0
    },
    catatan_penyelesaian: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status_pengerjaan: {
      type: DataTypes.STRING(17),
      allowNull: false,
      defaultValue: "(NMenunggu Diproses"
    },
    tanggal_selesai: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_paused: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 0
    },
    paused_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    return_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    return_status: {
      type: DataTypes.STRING(8),
      allowNull: true,
      defaultValue: "(NNone"
    },
    user_konfirmasi: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 0
    },
    tanggal_konfirmasi_user: {
      type: DataTypes.DATE,
      allowNull: true
    },
    admin_approve: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 0
    },
    admin_approve_by: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    admin_approve_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    admin_konfirmasi: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 0
    },
    tanggal_konfirmasi_admin: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'assignment_ticket',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "assignment_ticket$id_ticket",
        unique: true,
        fields: [
          { name: "id_ticket" },
        ]
      },
      {
        name: "id_teknisi",
        fields: [
          { name: "id_teknisi" },
        ]
      },
      {
        name: "idx_assignment_ticket_teknisi",
        fields: [
          { name: "id_teknisi" },
        ]
      },
      {
        name: "PK_assignment_ticket_id_assignment",
        unique: true,
        fields: [
          { name: "id_assignment" },
        ]
      },
    ]
  });
};
