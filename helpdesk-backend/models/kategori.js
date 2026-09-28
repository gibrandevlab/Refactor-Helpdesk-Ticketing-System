const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('kategori', {
    id_kategori: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    nama_kategori: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "kategori$nama_kategori"
    }
  }, {
    sequelize,
    tableName: 'kategori',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "kategori$nama_kategori",
        unique: true,
        fields: [
          { name: "nama_kategori" },
        ]
      },
      {
        name: "PK_kategori_id_kategori",
        unique: true,
        fields: [
          { name: "id_kategori" },
        ]
      },
    ]
  });
};
