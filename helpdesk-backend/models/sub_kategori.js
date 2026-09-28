const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('sub_kategori', {
    id_sub_kategori: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    id_kategori: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'kategori',
        key: 'id_kategori'
      }
    },
    nama_sub_kategori: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'sub_kategori',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "id_kategori",
        fields: [
          { name: "id_kategori" },
        ]
      },
      {
        name: "PK_sub_kategori_id_sub_kategori",
        unique: true,
        fields: [
          { name: "id_sub_kategori" },
        ]
      },
    ]
  });
};
