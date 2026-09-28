const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bagian_departemen', {
    id_bagian: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    id_departemen: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'departemen',
        key: 'id_departemen'
      }
    },
    nama_bagian: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'bagian_departemen',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "id_departemen",
        fields: [
          { name: "id_departemen" },
        ]
      },
      {
        name: "PK_bagian_departemen_id_bagian",
        unique: true,
        fields: [
          { name: "id_bagian" },
        ]
      },
    ]
  });
};
