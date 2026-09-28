const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./models');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads/lampiran', express.static(path.join(__dirname, 'uploads/lampiran')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/tickets', require('./routes/ticket.routes'));
app.use('/api/tickets', require('./routes/chat.routes'));
app.use('/api/approval', require('./routes/approval.routes'));
app.use('/api/assignment', require('./routes/assignment.routes'));
app.use('/api/karyawan', require('./routes/karyawan.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/master', require('./routes/master.routes'));
app.use('/api/teknisi', require('./routes/teknisi.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/feedback', require('./routes/feedback.routes'));
app.use('/api/schedule', require('./routes/schedule.routes'));
app.use('/api/checklist', require('./routes/checklist.routes'));
app.use('/api/profile', require('./routes/profile.routes'));

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Helpdesk Ticketing System API - PT Bakrie Pipe Industries'
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server'
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Berhasil terhubung ke database via Sequelize ORM');

    require('./cron');
    console.log('🕒 Cron job schedule preventive diaktifkan');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ GAGAL terhubung ke database via Sequelize:', err.message);
    process.exit(1);
  }
};

startServer();
