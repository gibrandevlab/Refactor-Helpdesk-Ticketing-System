const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('checklist_template', {
    id_item: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    kategori_unit: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    uraian_pekerjaan: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    alat_yang_digunakan: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    penerimaan_default: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    urutan: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'checklist_template',
    schema: 'project_sistem_magang_test',
    timestamps: false,
    indexes: [
      {
        name: "PK_checklist_template_id_item",
        unique: true,
        fields: [
          { name: "id_item" },
        ]
      },
    ]
  });
};
