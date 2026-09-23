const { convertMysqlToMssql } = require('./config/db');

const testQueries = [
  {
    name: 'Simple backtick & LIMIT',
    mysql: "SELECT `nik` FROM `user` WHERE `status` = 'Aktif' LIMIT 1",
  },
  {
    name: 'NOW() function',
    mysql: "UPDATE approval_ticket SET status_approval = ?, tanggal_approval = NOW() WHERE id_ticket = ?",
  },
  {
    name: 'CURDATE() function',
    mysql: "UPDATE ticket SET last_maintenance = CURDATE()",
  },
  {
    name: 'SUM boolean expression',
    mysql: "SELECT COUNT(*) AS total, SUM(status_pengerjaan = 'Menunggu Diproses') AS menunggu, SUM(status = 'Solved') AS solved FROM assignment_ticket",
  },
  {
    name: 'DATE_FORMAT',
    mysql: "SELECT DATE_FORMAT(tanggal_lapor, '%Y-%m') AS bulan, COUNT(*) AS jumlah FROM list_ticket GROUP BY bulan ORDER BY bulan ASC LIMIT 12",
  },
  {
    name: 'DATE_ADD INTERVAL',
    mysql: "UPDATE list_ticket SET deadline = DATE_ADD(deadline, INTERVAL ? SECOND) WHERE id_ticket = ?",
  },
  {
    name: 'GROUP_CONCAT',
    mysql: "SELECT (SELECT GROUP_CONCAT(kar.nama SEPARATOR ',') FROM karyawan kar) AS names",
  },
  {
    name: 'INSERT IGNORE',
    mysql: "INSERT IGNORE INTO checklist_approval (id_ticket) VALUES (?)",
  }
];

console.log('--- TESTING MYSQL TO MSSQL CONVERTER ---');
for (const t of testQueries) {
  console.log(`\nTest: ${t.name}`);
  console.log(`MySQL: ${t.mysql}`);
  console.log(`MSSQL: ${convertMysqlToMssql(t.mysql)}`);
}
