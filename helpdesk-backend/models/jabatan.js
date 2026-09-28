const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('jabatan', {
    id_jabatan: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    nama_jabatan: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "jabatan$nama_jabatan"
    }
  }, {
    sequelize,
    tableName: 'jabatan',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "jabatan$nama_jabatan",
        unique: true,
        fields: [
          { name: "nama_jabatan" },
        ]
      },
      {
        name: "PK_jabatan_id_jabatan",
        unique: true,
        fields: [
          { name: "id_jabatan" },
        ]
      },
    ]
  });
};
