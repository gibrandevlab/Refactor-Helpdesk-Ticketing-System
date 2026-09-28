const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('user', {
    id_user: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: "user$username"
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    nik: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: 'karyawan',
        key: 'nik'
      }
    },
    level: {
      type: DataTypes.STRING(7),
      allowNull: false,
      defaultValue: "(NUsers"
    },
    status: {
      type: DataTypes.STRING(8),
      allowNull: false,
      defaultValue: "(NAktif"
    }
  }, {
    sequelize,
    tableName: 'user',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "nik",
        fields: [
          { name: "nik" },
        ]
      },
      {
        name: "PK_user_id_user",
        unique: true,
        fields: [
          { name: "id_user" },
        ]
      },
      {
        name: "user$username",
        unique: true,
        fields: [
          { name: "username" },
        ]
      },
    ]
  });
};
