const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('karyawan', {
    nik: {
      type: DataTypes.STRING(10),
      allowNull: false,
      primaryKey: true
    },
    nama: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    tanda_tangan: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    alamat: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    jenis_kelamin: {
      type: DataTypes.STRING(9),
      allowNull: false
    },
    id_departemen: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'departemen',
        key: 'id_departemen'
      }
    },
    id_bagian: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'bagian_departemen',
        key: 'id_bagian'
      }
    },
    id_jabatan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'jabatan',
        key: 'id_jabatan'
      }
    },
    no_hp: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    tanggal_masuk: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'karyawan',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "id_bagian",
        fields: [
          { name: "id_bagian" },
        ]
      },
      {
        name: "id_departemen",
        fields: [
          { name: "id_departemen" },
        ]
      },
      {
        name: "id_jabatan",
        fields: [
          { name: "id_jabatan" },
        ]
      },
      {
        name: "PK_karyawan_nik",
        unique: true,
        fields: [
          { name: "nik" },
        ]
      },
    ]
  });
};
