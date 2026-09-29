const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('preventive_schedule', {
    id_schedule: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    nama_schedule: {
      type: DataTypes.STRING(100),
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
    frekuensi: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    satuan: {
      type: DataTypes.STRING(6),
      allowNull: false
    },
    tanggal_mulai: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    tanggal_selesai: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    id_teknis: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      defaultValue: 1
    },
    checklist_kategori: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.fn('getdate')
    }
  }, {
    sequelize,
    tableName: 'preventive_schedule',
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
        name: "PK_preventive_schedule_id_schedule",
        unique: true,
        fields: [
          { name: "id_schedule" },
        ]
      },
    ]
  });
};
