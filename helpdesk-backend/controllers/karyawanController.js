const {
  karyawan,
  departemen,
  bagian_departemen,
  jabatan,
  user
} = require('../models');
const { Op } = require('sequelize');

// Helper: Mencari ID Departemen, Bagian, Jabatan berdasarkan Nama
const getMasterIds = async (namaDept, namaBagian, namaJabatan) => {
  let id_departemen = null, id_bagian = null, id_jabatan = null;

  if (namaDept) {
    const dept = await departemen.findOne({
      where: { nama_departemen: namaDept },
      attributes: ['id_departemen']
    });
    id_departemen = dept ? dept.id_departemen : null;
  }
  if (namaBagian) {
    const bag = await bagian_departemen.findOne({
      where: { nama_bagian: namaBagian },
      attributes: ['id_bagian']
    });
    id_bagian = bag ? bag.id_bagian : null;
  }
  if (namaJabatan) {
    const jab = await jabatan.findOne({
      where: { nama_jabatan: namaJabatan },
      attributes: ['id_jabatan']
    });
    id_jabatan = jab ? jab.id_jabatan : null;
  }
  return { id_departemen, id_bagian, id_jabatan };
};

// ==========================================
// Ambil Semua Karyawan
// ==========================================
exports.getAll = async (req, res) => {
  try {
    const karyawanList = await karyawan.findAll({
      include: [
        { model: departemen, as: 'id_departemen_departemen' },
        { model: bagian_departemen, as: 'id_bagian_bagian_departemen' },
        { model: jabatan, as: 'id_jabatan_jabatan' }
      ],
      order: [['nik', 'ASC']]
    });

    const rows = karyawanList.map((k) => ({
      id: k.nik,
      nik: k.nik,
      nama: k.nama,
      alamat: k.alamat,
      jenisKelamin: k.jenis_kelamin,
      departemen: k.id_departemen_departemen?.nama_departemen || null,
      bagian: k.id_bagian_bagian_departemen?.nama_bagian || null,
      jabatan: k.id_jabatan_jabatan?.nama_jabatan || null
    }));

    return res.status(200).json(rows);
  } catch (err) {
    console.error('Gagal mengambil data karyawan (Sequelize):', err);
    return res.status(500).json({ error: 'Gagal mengambil data: ' + err.message });
  }
};

// ==========================================
// Ambil Karyawan yang Belum Punya Akun User
// ==========================================
exports.getAvailable = async (req, res) => {
  try {
    const availableKaryawan = await karyawan.findAll({
      include: [
        { model: user, as: 'users', required: false },
        { model: departemen, as: 'id_departemen_departemen' }
      ],
      order: [['nik', 'ASC']]
    });

    const filtered = availableKaryawan.filter((k) => !k.users || k.users.length === 0);

    const rows = filtered.map((k) => ({
      nik: k.nik,
      nama: k.nama,
      departemen: k.id_departemen_departemen?.nama_departemen || null
    }));

    return res.status(200).json(rows);
  } catch (err) {
    console.error('Gagal mengambil karyawan yang tersedia (Sequelize):', err);
    return res.status(500).json({ error: 'Gagal mengambil data karyawan yang tersedia: ' + err.message });
  }
};

// ==========================================
// CREATE Karyawan dengan NIK Otomatis (K0001, K0002, ...)
// ==========================================
exports.create = async (req, res) => {
  try {
    const { nama, alamat, jenisKelamin, departemen: deptName, bagian: bagName, jabatan: jabName } = req.body;

    if (!nama || !jenisKelamin || !deptName || !jabName) {
      return res.status(400).json({ error: 'nama, jenisKelamin, departemen, jabatan wajib diisi' });
    }

    const rows = await karyawan.findAll({
      where: {
        nik: { [Op.like]: 'K%' }
      },
      attributes: ['nik'],
      raw: true
    });

    let maxNum = 0;
    for (const r of rows) {
      if (r.nik) {
        const num = parseInt(r.nik.substring(1), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNumber = maxNum + 1;
    const nik = 'K' + String(nextNumber).padStart(4, '0');

    const ids = await getMasterIds(deptName, bagName, jabName);
    if (!ids.id_departemen) return res.status(400).json({ error: 'Departemen tidak ditemukan' });
    if (!ids.id_jabatan) return res.status(400).json({ error: 'Jabatan tidak ditemukan' });

    await karyawan.create({
      nik,
      nama,
      alamat: alamat || null,
      jenis_kelamin: jenisKelamin,
      id_departemen: ids.id_departemen,
      id_bagian: ids.id_bagian,
      id_jabatan: ids.id_jabatan
    });

    return res.status(201).json({ message: 'Karyawan berhasil ditambahkan', nik });
  } catch (err) {
    console.error('Gagal menambah karyawan (Sequelize):', err);
    return res.status(500).json({ error: 'Gagal menambah karyawan: ' + err.message });
  }
};

// ==========================================
// Update Data Karyawan
// ==========================================
exports.update = async (req, res) => {
  try {
    const { nama, alamat, jenisKelamin, departemen: deptName, bagian: bagName, jabatan: jabName } = req.body;
    const idParam = req.params.id;

    const ids = await getMasterIds(deptName, bagName, jabName);

    await karyawan.update(
      {
        nama,
        alamat,
        jenis_kelamin: jenisKelamin,
        id_departemen: ids.id_departemen,
        id_bagian: ids.id_bagian,
        id_jabatan: ids.id_jabatan
      },
      { where: { nik: idParam } }
    );

    return res.status(200).json({ message: 'Karyawan berhasil diperbarui' });
  } catch (err) {
    console.error('Gagal memperbarui karyawan (Sequelize):', err);
    return res.status(500).json({ error: 'Gagal memperbarui karyawan: ' + err.message });
  }
};

// ==========================================
// Hapus Data Karyawan
// ==========================================
exports.remove = async (req, res) => {
  try {
    const idParam = req.params.id;

    await karyawan.destroy({
      where: { nik: idParam }
    });

    return res.status(200).json({ message: 'Karyawan berhasil dihapus' });
  } catch (err) {
    console.error('Gagal menghapus karyawan (Sequelize):', err);

    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        error: 'Karyawan ini tidak bisa dihapus karena masih terhubung dengan data lain (misalnya sudah terdaftar sebagai Teknisi atau punya akun User). Hapus/lepas data terkait itu dulu.'
      });
    }

    return res.status(500).json({ error: 'Gagal menghapus karyawan: ' + err.message });
  }
};
