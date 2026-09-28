const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('laporan_feedback', {
    id_feedback: {
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
      },
      unique: "laporan_feedback$id_ticket"
    },
    nik_pelapor: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: 'karyawan',
        key: 'nik'
      }
    },
    tanggal: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    },
    feedback: {
      type: DataTypes.STRING(7),
      allowNull: false
    },
    keterangan: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    rating: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 5
    }
  }, {
    sequelize,
    tableName: 'laporan_feedback',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "laporan_feedback$id_ticket",
        unique: true,
        fields: [
          { name: "id_ticket" },
        ]
      },
      {
        name: "nik_pelapor",
        fields: [
          { name: "nik_pelapor" },
        ]
      },
      {
        name: "PK_laporan_feedback_id_feedback",
        unique: true,
        fields: [
          { name: "id_feedback" },
        ]
      },
    ]
  });
};
