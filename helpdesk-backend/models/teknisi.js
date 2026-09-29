const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('teknisi', {
    id_teknisi: {
      type: DataTypes.STRING(15),
      allowNull: false,
      primaryKey: true
    },
    nik: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: 'karyawan',
        key: 'nik'
      },
      unique: "teknisi$nik"
    },
    id_kategori: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'kategori',
        key: 'id_kategori'
      }
    },
    status: {
      type: DataTypes.STRING(8),
      allowNull: false,
      defaultValue: "Aktif"
    },
    jumlah_tiket_ditangani: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'teknisi',
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
        name: "PK_teknisi_id_teknisi",
        unique: true,
        fields: [
          { name: "id_teknisi" },
        ]
      },
      {
        name: "teknisi$nik",
        unique: true,
        fields: [
          { name: "nik" },
        ]
      },
    ]
  });
};
