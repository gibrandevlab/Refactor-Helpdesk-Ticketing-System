const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { poolPromise, query } = require('./config/db');

const app = express();

// =========================================================
// Middleware Configurations
// =========================================================
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Memetakan folder static / uploads
app.use('/uploads/lampiran', express.static(path.join(__dirname, 'uploads/lampiran')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =========================================================
// API Routes
// =========================================================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/tickets', require('./routes/ticket.routes'));
app.use('/api/tickets', require('./routes/chat.routes')); // Chat sub-routes
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

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Helpdesk Ticketing System API - PT Bakrie Pipe Industries'
  });
});

// =========================================================
// Error Handlers
// =========================================================
// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server'
  });
});

// =========================================================
// Server Bootstrapping & DB Initialization
// =========================================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await poolPromise;
    await query('SELECT 1');
    console.log('✅ Berhasil terhubung ke Microsoft SQL Server (Docker)');

    // Inisialisasi cron jobs setelah DB siap
    require('./cron');
    console.log('🕒 Cron job schedule preventive diaktifkan');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ GAGAL terhubung ke database SQL Server:', err.message);
    console.error('   Cek: Container Docker MSSQL running & konfigurasi .env sesuai.');
    process.exit(1);
  }
};

startServer();
