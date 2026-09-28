const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ticket_chat', {
    id_chat: {
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
      }
    },
    sender_id: {
      type: DataTypes.STRING(15),
      allowNull: false
    },
    sender_role: {
      type: DataTypes.STRING(7),
      allowNull: false
    },
    sender_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    attachment_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_read: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'ticket_chat',
    schema: 'project_sistem_magang_test',
    timestamps: true,
    createdAt: 'created_at',   // sesuai nama kolom di DB & dipakai frontend/controller
    updatedAt: false,          // tabel tidak punya kolom updated_at
    indexes: [
      {
        name: "id_ticket",
        fields: [
          { name: "id_ticket" },
        ]
      },
      {
        name: "PK_ticket_chat_id_chat",
        unique: true,
        fields: [
          { name: "id_chat" },
        ]
      },
    ]
  });
};
