const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('inventory', {
    kode_asset: {
      type: DataTypes.STRING(15),
      allowNull: false,
      primaryKey: true
    },
    nama_barang: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    merk_model: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    computer_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    it_priority: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    tahun_perolehan: {
      type: DataTypes.SMALLINT,
      allowNull: true
    },
    user_pemakai: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    extension: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    divisi: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    gedung: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
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
      allowNull: false,
      references: {
        model: 'kategori',
        key: 'id_kategori'
      }
    },
    nik_pemegang: {
      type: DataTypes.STRING(10),
      allowNull: true,
      references: {
        model: 'karyawan',
        key: 'nik'
      }
    },
    status_aset: {
      type: DataTypes.STRING(11),
      allowNull: false,
      defaultValue: "(NAktif"
    },
    foto: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    ram: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    prosesor: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    penyimpanan: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    last_maintenance: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    next_maintenance: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    id_preventive_schedule: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'preventive_schedule',
        key: 'id_schedule'
      }
    }
  }, {
    sequelize,
    tableName: 'inventory',
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
        name: "id_preventive_schedule",
        fields: [
          { name: "id_preventive_schedule" },
        ]
      },
      {
        name: "nik_pemegang",
        fields: [
          { name: "nik_pemegang" },
        ]
      },
      {
        name: "PK_inventory_kode_asset",
        unique: true,
        fields: [
          { name: "kode_asset" },
        ]
      },
    ]
  });
};
