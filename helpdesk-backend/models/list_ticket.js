const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('list_ticket', {
    id_ticket: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true
    },
    nik_pelapor: {
      type: DataTypes.STRING(10),
      allowNull: false,
      references: {
        model: 'karyawan',
        key: 'nik'
      }
    },
    id_departemen: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'departemen',
        key: 'id_departemen'
      }
    },
    id_kategori: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'kategori',
        key: 'id_kategori'
      }
    },
    id_sub_kategori: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'sub_kategori',
        key: 'id_sub_kategori'
      }
    },
    kode_asset: {
      type: DataTypes.STRING(15),
      allowNull: true,
      references: {
        model: 'inventory',
        key: 'kode_asset'
      }
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lampiran: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    tanggal_lapor: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    },
    status: {
      type: DataTypes.STRING(19),
      allowNull: false,
      defaultValue: "(NMenunggu Approval"
    },
    prioritas: {
      type: DataTypes.STRING(6),
      allowNull: true,
      defaultValue: "(NNormal"
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true
    },
    id_schedule: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'preventive_schedule',
        key: 'id_schedule'
      }
    }
  }, {
    sequelize,
    tableName: 'list_ticket',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "fk_list_ticket_schedule",
        fields: [
          { name: "id_schedule" },
        ]
      },
      {
        name: "id_departemen",
        fields: [
          { name: "id_departemen" },
        ]
      },
      {
        name: "id_kategori",
        fields: [
          { name: "id_kategori" },
        ]
      },
      {
        name: "id_sub_kategori",
        fields: [
          { name: "id_sub_kategori" },
        ]
      },
      {
        name: "kode_asset",
        fields: [
          { name: "kode_asset" },
        ]
      },
      {
        name: "nik_pelapor",
        fields: [
          { name: "nik_pelapor" },
        ]
      },
      {
        name: "PK_list_ticket_id_ticket",
        unique: true,
        fields: [
          { name: "id_ticket" },
        ]
      },
    ]
  });
};
