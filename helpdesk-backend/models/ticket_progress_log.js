const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ticket_progress_log', {
    id_log: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    id_assignment: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'assignment_ticket',
        key: 'id_assignment'
      }
    },
    progress: {
      type: DataTypes.SMALLINT,
      allowNull: false
    },
    catatan: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status_pengerjaan: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    // 🔴 1. Tambahkan definisi kolom created_at di sini
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    }
  }, {
    sequelize,
    tableName: 'ticket_progress_log',
    schema: 'project_sistem_magang_test',
    timestamps: false, // 🔴 2. Ubah jadi FALSE agar Sequelize tidak mencari createdAt & updatedAt
    indexes: [
      {
        name: "id_assignment",
        fields: [
          { name: "id_assignment" },
        ]
      },
      {
        name: "PK_ticket_progress_log_id_log",
        unique: true,
        fields: [
          { name: "id_log" },
        ]
      },
    ]
  });
};
