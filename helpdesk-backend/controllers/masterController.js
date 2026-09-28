const models = require('../models');
const { ok, created, fail } = require('../utils/response');

// Factory CRUD generik untuk master sederhana
function buildSimpleCrud(modelName, pk, nameField) {
  return {
    getAll: async (req, res) => {
      try {
        const rows = await models[modelName].findAll({
          order: [[pk, 'ASC']]
        });
        return ok(res, rows);
      } catch (err) {
        console.error(`Error getAll ${modelName} (Sequelize):`, err);
        return fail(res, `Gagal mengambil data ${modelName}: ` + err.message, 500);
      }
    },
    create: async (req, res) => {
      try {
        const value = req.body[nameField];
        if (!value) return fail(res, `${nameField} wajib diisi`, 400);

        const result = await models[modelName].create({
          [nameField]: value
        });

        return created(res, { [pk]: result[pk] }, 'Berhasil ditambahkan');
      } catch (err) {
        console.error(`Error create ${modelName} (Sequelize):`, err);
        return fail(res, 'Gagal menambah data: ' + err.message, 500);
      }
    },
    update: async (req, res) => {
      try {
        const value = req.body[nameField];
        const id = parseInt(req.params.id);

        await models[modelName].update(
          { [nameField]: value },
          { where: { [pk]: id } }
        );

        return ok(res, null, 'Berhasil diperbarui');
      } catch (err) {
        console.error(`Error update ${modelName} (Sequelize):`, err);
        return fail(res, 'Gagal memperbarui data: ' + err.message, 500);
      }
    },
    remove: async (req, res) => {
      try {
        const id = parseInt(req.params.id);

        await models[modelName].destroy({
          where: { [pk]: id }
        });

        return ok(res, null, 'Berhasil dihapus');
      } catch (err) {
        console.error(`Error remove ${modelName} (Sequelize):`, err);
        if (err.name === 'SequelizeForeignKeyConstraintError') {
          return fail(res, 'Gagal menghapus (kemungkinan masih dipakai data lain)', 400);
        }
        return fail(res, 'Gagal menghapus data: ' + err.message, 500);
      }
    }
  };
}

exports.jabatan = buildSimpleCrud('jabatan', 'id_jabatan', 'nama_jabatan');
exports.departemen = buildSimpleCrud('departemen', 'id_departemen', 'nama_departemen');
exports.kategori = buildSimpleCrud('kategori', 'id_kategori', 'nama_kategori');

// Bagian Departemen (Relasi ke Departemen)
exports.bagianDepartemen = {
  getAll: async (req, res) => {
    try {
      const list = await models.bagian_departemen.findAll({
        include: [
          { model: models.departemen, as: 'id_departemen_departemen' }
        ],
        order: [['id_bagian', 'ASC']]
      });

      const formatted = list.map((b) => ({
        id_bagian: b.id_bagian,
        nama_bagian: b.nama_bagian,
        id_departemen: b.id_departemen,
        departemen: b.id_departemen_departemen?.nama_departemen || null
      }));

      return ok(res, formatted);
    } catch (err) {
      console.error('Error getAll bagianDepartemen (Sequelize):', err);
      return fail(res, 'Gagal mengambil data bagian departemen: ' + err.message, 500);
    }
  },
  create: async (req, res) => {
    try {
      const { id_departemen, nama_bagian } = req.body;
      if (!id_departemen || !nama_bagian) {
        return fail(res, 'id_departemen dan nama_bagian wajib diisi', 400);
      }

      const result = await models.bagian_departemen.create({
        id_departemen: parseInt(id_departemen),
        nama_bagian
      });

      return created(res, { id_bagian: result.id_bagian }, 'Bagian departemen berhasil ditambahkan');
    } catch (err) {
      console.error('Error create bagianDepartemen (Sequelize):', err);
      return fail(res, 'Gagal menambah bagian departemen: ' + err.message, 500);
    }
  },
  update: async (req, res) => {
    try {
      const { id_departemen, nama_bagian } = req.body;
      const id_bagian = parseInt(req.params.id);

      await models.bagian_departemen.update(
        {
          id_departemen: parseInt(id_departemen),
          nama_bagian
        },
        { where: { id_bagian } }
      );

      return ok(res, null, 'Bagian departemen berhasil diperbarui');
    } catch (err) {
      console.error('Error update bagianDepartemen (Sequelize):', err);
      return fail(res, 'Gagal memperbarui bagian departemen: ' + err.message, 500);
    }
  },
  remove: async (req, res) => {
    try {
      const id_bagian = parseInt(req.params.id);

      await models.bagian_departemen.destroy({
        where: { id_bagian }
      });

      return ok(res, null, 'Bagian departemen berhasil dihapus');
    } catch (err) {
      console.error('Error remove bagianDepartemen (Sequelize):', err);
      if (err.name === 'SequelizeForeignKeyConstraintError') {
        return fail(res, 'Gagal menghapus bagian departemen (kemungkinan masih dipakai data lain)', 400);
      }
      return fail(res, 'Gagal menghapus bagian departemen: ' + err.message, 500);
    }
  }
};

// Sub Kategori (Relasi ke Kategori)
exports.subKategori = {
  getAll: async (req, res) => {
    try {
      const list = await models.sub_kategori.findAll({
        include: [
          { model: models.kategori, as: 'id_kategori_kategori' }
        ],
        order: [['id_sub_kategori', 'ASC']]
      });

      const formatted = list.map((sk) => ({
        id_sub_kategori: sk.id_sub_kategori,
        nama_sub_kategori: sk.nama_sub_kategori,
        id_kategori: sk.id_kategori,
        kategori: sk.id_kategori_kategori?.nama_kategori || null
      }));

      return ok(res, formatted);
    } catch (err) {
      console.error('Error getAll subKategori (Sequelize):', err);
      return fail(res, 'Gagal mengambil data sub kategori: ' + err.message, 500);
    }
  },
  getByKategori: async (req, res) => {
    try {
      const id_kategori = parseInt(req.params.id_kategori);

      const list = await models.sub_kategori.findAll({
        where: { id_kategori }
      });

      return ok(res, list);
    } catch (err) {
      console.error('Error getByKategori subKategori (Sequelize):', err);
      return fail(res, 'Gagal mengambil sub kategori: ' + err.message, 500);
    }
  },
  create: async (req, res) => {
    try {
      const { id_kategori, nama_sub_kategori } = req.body;
      if (!id_kategori || !nama_sub_kategori) {
        return fail(res, 'id_kategori dan nama_sub_kategori wajib diisi', 400);
      }

      const result = await models.sub_kategori.create({
        id_kategori: parseInt(id_kategori),
        nama_sub_kategori
      });

      return created(res, { id_sub_kategori: result.id_sub_kategori }, 'Sub kategori berhasil ditambahkan');
    } catch (err) {
      console.error('Error create subKategori (Sequelize):', err);
      return fail(res, 'Gagal menambah sub kategori: ' + err.message, 500);
    }
  },
  update: async (req, res) => {
    try {
      const { id_kategori, nama_sub_kategori } = req.body;
      const id_sub_kategori = parseInt(req.params.id);

      await models.sub_kategori.update(
        {
          id_kategori: parseInt(id_kategori),
          nama_sub_kategori
        },
        { where: { id_sub_kategori } }
      );

      return ok(res, null, 'Sub kategori berhasil diperbarui');
    } catch (err) {
      console.error('Error update subKategori (Sequelize):', err);
      return fail(res, 'Gagal memperbarui sub kategori: ' + err.message, 500);
    }
  },
  remove: async (req, res) => {
    try {
      const id_sub_kategori = parseInt(req.params.id);

      await models.sub_kategori.destroy({
        where: { id_sub_kategori }
      });

      return ok(res, null, 'Sub kategori berhasil dihapus');
    } catch (err) {
      console.error('Error remove subKategori (Sequelize):', err);
      if (err.name === 'SequelizeForeignKeyConstraintError') {
        return fail(res, 'Gagal menghapus sub kategori (kemungkinan masih dipakai data lain)', 400);
      }
      return fail(res, 'Gagal menghapus sub kategori: ' + err.message, 500);
    }
  }
};
