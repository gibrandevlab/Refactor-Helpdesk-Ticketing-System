const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('departemen', {
    id_departemen: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    nama_departemen: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "departemen$nama_departemen"
    }
  }, {
    sequelize,
    tableName: 'departemen',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "departemen$nama_departemen",
        unique: true,
        fields: [
          { name: "nama_departemen" },
        ]
      },
      {
        name: "PK_departemen_id_departemen",
        unique: true,
        fields: [
          { name: "id_departemen" },
        ]
      },
    ]
  });
};
