// chat.routes.js
const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const c = require('../controllers/chatController');

router.get('/:id_ticket/chat', verifyToken, c.getChats);

// Menggunakan upload.single('foto') dengan penanganan error internal jika tidak ada file
router.post('/:id_ticket/chat', verifyToken, (req, res, next) => {
  upload.single('foto')(req, res, (err) => {
    if (err) {
      console.error('Multer Error:', err);
      return res.status(400).json({ status: false, message: 'Gagal memproses file upload: ' + err.message });
    }
    next();
  });
}, c.sendChat);

module.exports = router;
