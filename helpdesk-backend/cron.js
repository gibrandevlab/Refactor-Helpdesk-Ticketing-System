const prisma = require('./config/prisma');
const cron = require('node-cron');

// ============================================================
// 🔥 AMBIL NIK ADMIN
// ============================================================
async function getAdminNik() {
  try {
    // 1. Cari user level Admin yang Aktif
    const adminUser = await prisma.user.findFirst({
      where: {
        level: 'Admin',
        status: 'Aktif'
      },
      select: { nik: true }
    });

    if (adminUser?.nik) return adminUser.nik;

    // 2. Fallback: Cari karyawan dengan jabatan Manager/Kepala/Supervisor
    const karyawanManager = await prisma.karyawan.findFirst({
      where: {
        jabatan: {
          OR: [
            { nama_jabatan: { contains: 'Kepala' } },
            { nama_jabatan: { contains: 'Manager' } },
            { nama_jabatan: { contains: 'Supervisor' } }
          ]
        }
      },
      select: { nik: true }
    });

    if (karyawanManager?.nik) return karyawanManager.nik;

    // 3. Fallback terakhir: Ambil sembarang karyawan
    const anyKaryawan = await prisma.karyawan.findFirst({
      select: { nik: true }
    });

    if (anyKaryawan?.nik) return anyKaryawan.nik;

    throw new Error('❌ Tidak ada karyawan ditemukan.');
  } catch (err) {
    console.error('Error getAdminNik:', err.message);
    throw err;
  }
}

// ============================================================
// 🔥 GET ID TEKNISI (PAKAI TABEL TEKNISI)
// ============================================================
async function getTeknisiId(identifier) {
  if (!identifier) return null;
  try {
    const idNum = parseInt(identifier);
    const teknisi = await prisma.teknisi.findFirst({
      where: {
        id_teknisi: !isNaN(idNum) ? idNum : undefined,
        status: 'Aktif'
      },
      select: { id_teknisi: true }
    });

    if (teknisi) {
      console.log(`   ✅ Ditemukan teknisi: ${identifier}`);
      return teknisi.id_teknisi;
    }

    console.log(`   ⚠️ Teknisi "${identifier}" TIDAK ditemukan di tabel teknisi.`);
    return null;
  } catch (err) {
    console.error(`Error getTeknisiId for ${identifier}:`, err.message);
    return null;
  }
}

// ============================================================
// 🔥 CEK APAKAH TEKNISI SEDANG BERTUGAS
// ============================================================
async function isTeknisiBusy(idTeknisi) {
  const count = await prisma.assignmentTicket.count({
    where: {
      id_teknisi: parseInt(idTeknisi),
      status_pengerjaan: { not: 'Selesai' }
    }
  });
  return count > 0;
}

// ============================================================
// 🔥 PROSES SCHEDULE PREVENTIVE
// ============================================================
async function processSchedules() {
  try {
    console.log('⏰ Cron job: Memproses schedule preventive...');
    console.log(`📅 Waktu server: ${new Date().toISOString()}`);

    const adminNik = await getAdminNik();
    console.log(` Admin NIK: ${adminNik}`);

    // Ambil semua schedule aktif beserta relasi asetnya
    const schedules = await prisma.preventiveSchedule.findMany({
      where: { is_active: 1 },
      include: {
        schedule_asset: true
      }
    });

    if (schedules.length === 0) {
      console.log('✅ Tidak ada schedule aktif.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let anyCreated = false;

    for (const schedule of schedules) {
      try {
        const id_schedule = schedule.id_schedule;
        console.log(`🔍 Memeriksa schedule ID ${id_schedule}: "${schedule.nama_schedule}"`);

        const assets = (schedule.schedule_asset || []).map((sa) => sa.kode_asset);
        if (assets.length === 0) {
          console.log(`   ⏭️ Tidak ada aset yang terhubung ke schedule ini.`);
          continue;
        }

        // Ambil last_maintenance dari inventory
        const maxMaintenance = await prisma.inventory.aggregate({
          _max: { last_maintenance: true },
          where: { id_preventive_schedule: id_schedule }
        });

        let lastMaintenance = maxMaintenance._max.last_maintenance;
        let nextDate;

        if (lastMaintenance) {
          const lastDate = new Date(lastMaintenance);
          console.log(`   📅 Last maintenance: ${lastDate.toISOString().split('T')[0]}`);
          nextDate = new Date(lastDate);
          if (schedule.satuan === 'hari') nextDate.setDate(nextDate.getDate() + schedule.frekuensi);
          else if (schedule.satuan === 'minggu') nextDate.setDate(nextDate.getDate() + (schedule.frekuensi * 7));
          else if (schedule.satuan === 'bulan') nextDate.setMonth(nextDate.getMonth() + schedule.frekuensi);
          else if (schedule.satuan === 'tahun') nextDate.setFullYear(nextDate.getFullYear() + schedule.frekuensi);
          console.log(`   📅 Next maintenance: ${nextDate.toISOString().split('T')[0]}`);
        } else {
          nextDate = new Date(today);
          console.log(`   📅 Belum pernah maintenance, next = hari ini: ${nextDate.toISOString().split('T')[0]}`);
        }

        nextDate.setHours(0, 0, 0, 0);

        if (nextDate.getTime() !== today.getTime()) {
          console.log(`   ⏭️ Tidak jatuh tempo (next: ${nextDate.toISOString().split('T')[0]})`);
          continue;
        }

        console.log(`   🔔 JATUH TEMPO HARI INI!`);

        // Parse list teknisi
        let teknisList = [];
        if (schedule.id_teknis) {
          let rawTeknis = schedule.id_teknis;
          try {
            const parsed = JSON.parse(rawTeknis);
            if (Array.isArray(parsed)) teknisList = parsed;
            else teknisList = [parsed];
          } catch {
            teknisList = String(rawTeknis).split(',').map((s) => s.trim()).filter(Boolean);
          }
        }

        // Cari teknisi yang tersedia
        const availableTeknis = [];
        for (const item of teknisList) {
          const idTeknisi = await getTeknisiId(item);
          if (idTeknisi) {
            const isBusy = await isTeknisiBusy(idTeknisi);
            if (!isBusy) {
              availableTeknis.push(idTeknisi);
              console.log(`   ✅ Teknisi ${item} tersedia`);
            } else {
              console.log(`   ⚠️ Teknisi ${item} sedang bertugas`);
            }
          } else {
            console.warn(`   ⚠️ Teknisi "${item}" TIDAK ADA di tabel teknisi`);
          }
        }

        if (availableTeknis.length === 0) {
          console.warn(`   ⚠️ Tidak ada teknisi tersedia untuk schedule "${schedule.nama_schedule}", skip...`);
          continue;
        }

        // Buat tiket untuk setiap aset
        for (const kodeAsset of assets) {
          const idTicket = `T${Date.now()}${Math.floor(Math.random() * 1000)}`;
          const now = new Date();

          await prisma.$transaction(async (tx) => {
            // INSERT KE LIST_TICKET
            await tx.listTicket.create({
              data: {
                id_ticket: idTicket,
                nik_pelapor: adminNik,
                id_departemen: schedule.id_departemen,
                id_kategori: schedule.id_kategori || null,
                id_sub_kategori: schedule.id_sub_kategori || null,
                kode_asset: kodeAsset,
                deskripsi: `[PREVENTIVE] ${schedule.nama_schedule}${schedule.deskripsi ? ' - ' + schedule.deskripsi : ''}`,
                lampiran: null,
                tanggal_lapor: now,
                status: 'On Process'
              }
            });

            // ASSIGN KE TEKNISI PERTAMA
            const idTeknisi = availableTeknis[0];
            await tx.assignmentTicket.create({
              data: {
                id_ticket: idTicket,
                id_teknisi: parseInt(idTeknisi),
                tanggal_assign: now,
                progress: 0,
                status_pengerjaan: 'Menunggu Diproses'
              }
            });

            // Update inventory
            const nextMaintenanceDate = new Date(now);
            if (schedule.satuan === 'hari') nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + schedule.frekuensi);
            else if (schedule.satuan === 'minggu') nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + (schedule.frekuensi * 7));
            else if (schedule.satuan === 'bulan') nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + schedule.frekuensi);
            else if (schedule.satuan === 'tahun') nextMaintenanceDate.setFullYear(nextMaintenanceDate.getFullYear() + schedule.frekuensi);

            await tx.inventory.update({
              where: { kode_asset: kodeAsset },
              data: {
                last_maintenance: now,
                next_maintenance: nextMaintenanceDate
              }
            });

            console.log(`   ✅ Tiket ${idTicket} dibuat untuk aset ${kodeAsset} -> teknisi ${idTeknisi}`);
            anyCreated = true;
          });
        }
      } catch (err) {
        console.error(`❌ Error pada schedule ID ${schedule.id_schedule}:`, err);
        continue;
      }
    }

    if (anyCreated) {
      console.log('✅ Cron job selesai – tiket berhasil dibuat.');
    } else {
      console.log('✅ Cron job selesai – tidak ada tiket yang dibuat hari ini.');
    }
  } catch (error) {
    console.error('❌ Cron job error:', error);
  }
}

// ============================================================
// 🔥 CRON JALAN OTOMATIS SETIAP HARI JAM 08:00 WIB
// ============================================================
cron.schedule('0 8 * * *', () => {
  console.log('🕒 [CRON] Triggered at 08:00 WIB');
  processSchedules();
});

console.log('🕒 Cron job schedule preventive diaktifkan (setiap hari jam 08:00 WIB)');

module.exports = { processSchedules };
