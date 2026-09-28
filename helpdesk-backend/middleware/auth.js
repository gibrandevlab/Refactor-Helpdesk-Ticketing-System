const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verifikasi token JWT
function verifyToken(req, res, next) {
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan, silakan login' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token tidak valid atau kadaluarsa' });
    }
    req.user = decoded;
    next();
  });
}

// Batasi akses berdasarkan role (Mendukung req.user.level maupun req.user.role)
function checkRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ success: false, message: 'Anda tidak punya akses ke fitur ini' });
    }

    // Cek req.user.level ATAU req.user.role
    const userRole = String(req.user.level || req.user.role || '').toLowerCase();

    // Normalisasi perbandingan role (case-insensitive & toleransi akhiran 's')
    const hasAccess = allowedRoles.some(role => {
      const targetRole = String(role).toLowerCase();
      return userRole === targetRole ||
             userRole === targetRole.replace(/s$/, '') ||
             userRole + 's' === targetRole;
    });

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Anda tidak punya akses ke fitur ini' });
    }
    next();
  };
}

module.exports = { verifyToken, checkRole };
