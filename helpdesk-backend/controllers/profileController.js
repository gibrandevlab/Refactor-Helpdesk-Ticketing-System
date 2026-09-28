const { karyawan } = require('../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads', 'signatures');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `ttd_${req.user.nik}_${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File harus berupa gambar (PNG/JPG)'), false);
  }
};

exports.uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
}).single('signature');

// ============================================================
// POST /profile/signature — upload/ganti tanda tangan milik user login
// ============================================================
exports.uploadSignature = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File tanda tangan wajib diupload' });
    }

    const nik = req.user.nik;

    const dataKaryawan = await karyawan.findOne({
      where: { nik },
      attributes: ['tanda_tangan']
    });

    const oldPath = dataKaryawan?.tanda_tangan;
    if (oldPath) {
      const oldFullPath = path.join(__dirname, '..', oldPath);
      if (fs.existsSync(oldFullPath)) {
        fs.unlink(oldFullPath, () => {});
      }
    }

    const relativePath = `/uploads/signatures/${req.file.filename}`;
    await karyawan.update(
      { tanda_tangan: relativePath },
      { where: { nik } }
    );

    return res.json({ message: 'Tanda tangan berhasil disimpan', tanda_tangan: relativePath });
  } catch (error) {
    console.error('uploadSignature error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal menyimpan tanda tangan' });
  }
};

// ============================================================
// GET /profile/signature — cek tanda tangan milik user login
// ============================================================
exports.getSignature = async (req, res) => {
  try {
    const nik = req.user.nik;
    const dataKaryawan = await karyawan.findOne({
      where: { nik },
      attributes: ['tanda_tangan']
    });

    return res.json({ tanda_tangan: dataKaryawan?.tanda_tangan || null });
  } catch (error) {
    console.error('getSignature error (Sequelize):', error);
    return res.status(500).json({ message: 'Gagal mengambil tanda tangan' });
  }
};
