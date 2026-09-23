const sql = require('mssql');
require('dotenv').config();

const schemaName = process.env.DB_SCHEMA || 'project_sistem_magang_test';

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'RootPassword123!',
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  database: process.env.DB_NAME || 'master',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT !== 'false'
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log(`✅ Connected to Microsoft SQL Server (${config.server}:${config.port}/${config.database})`);
    return pool;
  })
  .catch(err => {
    console.error('❌ SQL Server Connection Failed:', err.message);
    throw err;
  });

/**
 * Konversi Dialek SQL: Mengubah fungsi & sintaks khusus MySQL menjadi MSSQL secara otomatis.
 */
function convertMysqlToMssql(queryStr) {
  if (!queryStr || typeof queryStr !== 'string') return queryStr;
  let q = queryStr;

  // 1. Ubah backtick identifier `tabel` / `kolom` -> [tabel] / [kolom]
  q = q.replace(/`([^`]+)`/g, '[$1]');

  // 2. Otomatis selipkan nama Schema jika query memanggil tabel langsung tanpa schema
// Tambahkan 'preventive_schedule' ke dalam array knownTables
  const knownTables = [
    'approval_ticket', 'asset_department_history', 'asset_hardware', 'asset_hardware_detail',
    'asset_history', 'asset_holder_history', 'asset_software', 'asset_software_detail',
    'assignment_ticket', 'bagian_departemen', 'checklist_approval', 'checklist_template',
    'departemen', 'inventory', 'jabatan', 'karyawan', 'kategori', 'laporan_feedback',
    'list_ticket', 'preventive_schedule', 'schedule_asset', 'schedule_asset_claim',
    'sub_kategori', 'teknisi', 'ticket_chat', 'ticket_checklist_result',
    'ticket_progress_log', 'user', 'v_dashboard_summary'
  ];

  knownTables.forEach(tbl => {
    const regex = new RegExp(`\\b(FROM|JOIN|INTO|UPDATE|DELETE\\s+FROM)\\s+(\\[?${tbl}\\]?)\\b(?!\\.)`, 'gi');
    const targetTbl = tbl === 'user' ? '[user]' : `[${tbl}]`;
    q = q.replace(regex, `$1 [${schemaName}].${targetTbl}`);
  });

  // 3. Ubah string literal bertanda petik ganda "Aktif" menjadi petik tunggal 'Aktif'
  q = q.replace(/"([^"\r\n]+)"/g, "'$1'");

  // 4. NOW() -> GETDATE()
  q = q.replace(/\bNOW\(\)/gi, 'GETDATE()');

  // 5. CURDATE() -> CAST(GETDATE() AS DATE)
  q = q.replace(/\bCURDATE\(\)/gi, 'CAST(GETDATE() AS DATE)');

  // 6. DATE_FORMAT
  q = q.replace(/DATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'\%Y-\%m'\s*\)/gi, "FORMAT($1, 'yyyy-MM')");
  q = q.replace(/DATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'\%Y-\%m-\%d'\s*\)/gi, "FORMAT($1, 'yyyy-MM-dd')");

  // 7. DATE_ADD
  q = q.replace(/DATE_ADD\s*\(\s*([^,]+)\s*,\s*INTERVAL\s+(\S+)\s+(SECOND\vert{}MINUTE\vert{}HOUR\vert{}DAY\vert{}MONTH\vert{}YEAR)\s*\)/gi, (m, dateExpr, valExpr, unit) => {
    return `DATEADD(${unit.toLowerCase()}, ${valExpr}, ${dateExpr})`;
  });

  // 8. SUM(kolom = 'nilai') -> SUM(CASE WHEN kolom = 'nilai' THEN 1 ELSE 0 END)
  q = q.replace(/\bSUM\s*\(\s*([a-zA-Z0-9_\.]+)\s*=\s*'([^']+)'\s*\)/gi, "SUM(CASE WHEN $1 = '$2' THEN 1 ELSE 0 END)");
  q = q.replace(/\bSUM\s*\(\s*([a-zA-Z0-9_\.]+)\s*=\s*(\d+)\s*\)/gi, "SUM(CASE WHEN $1 = $2 THEN 1 ELSE 0 END)");

  // 9. ORDER BY FIELD(col, 'A', 'B', ...) -> ORDER BY CASE col WHEN 'A' THEN 1 WHEN 'B' THEN 2 ...
  q = q.replace(/ORDER\s+BY\s+FIELD\s*\(\s*([a-zA-Z0-9_\.]+)\s*,\s*([^)]+)\)/gi, (m, col, vals) => {
    const list = vals.split(',').map(v => v.trim());
    const cases = list.map((v, i) => `WHEN ${v} THEN ${i + 1}`).join(' ');
    return `ORDER BY CASE ${col} ${cases} ELSE 99 END`;
  });

  // 10. GROUP_CONCAT(...) -> STRING_AGG(...)
  q = q.replace(/GROUP_CONCAT\s*\(\s*(?:DISTINCT\s+)?(?:DATE\s*\(\s*([^)]+)\s*\)\vert{}([^)]+?))\s*(?:ORDER\s+BY\s+[^)]+?)?\s+SEPARATOR\s+(['"][^'"]*['"])\s*\)/gi, (m, dateCol, normalCol, sep) => {
    const col = dateCol ? `CAST(${dateCol} AS DATE)` : normalCol.trim();
    return `STRING_AGG(CAST(${col} AS VARCHAR(MAX)), ${sep})`;
  });

  // 11. INSERT IGNORE INTO -> IF NOT EXISTS
  q = q.replace(/INSERT\s+IGNORE\s+INTO\s+([a-zA-Z0-9_\[\]\.]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/gi, (m, tbl, cols, vals) => {
    const colList = cols.split(',').map(s => s.trim());
    const valList = vals.split(',').map(s => s.trim());
    const conds = colList.map((c, i) => `${c} = ${valList[i] || 'NULL'}`).join(' AND ');
    return `IF NOT EXISTS (SELECT 1 FROM ${tbl} WHERE ${conds}) INSERT INTO ${tbl} (${cols}) VALUES (${vals})`;
  });

  // 12. SELECT ... LIMIT n -> SELECT TOP n ...
  q = q.replace(/\bSELECT\s+(?!TOP\b)([\s\S]+?)\s+LIMIT\s+(\d+)(\s*[\)\;]?)/gi, 'SELECT TOP $2 $1$3');

  return q;
}

/**
 * Memproses query
 */
const executeQuery = async (executor, queryStr, params = []) => {
  const request = executor.request();
  let paramIndex = 0;
  let convertedQuery = convertMysqlToMssql(queryStr);

  const isInsert = /^\s*INSERT\s+INTO/i.test(convertedQuery);
  if (isInsert && !/OUTPUT\s+INSERTED/i.test(convertedQuery)) {
    convertedQuery += '; SELECT SCOPE_IDENTITY() AS insertId;';
  }

  const formattedQuery = convertedQuery.replace(/\?/g, () => {
    const paramName = `p${paramIndex}`;
    const paramVal = params[paramIndex];
    request.input(paramName, paramVal);
    paramIndex++;
    return `@${paramName}`;
  });

  const result = await request.query(formattedQuery);

  let rows = result.recordset || [];

  let insertId = null;
  if (result.recordsets && result.recordsets.length > 1) {
    const lastSet = result.recordsets[result.recordsets.length - 1];
    if (lastSet && lastSet[0] && lastSet[0].insertId) {
      insertId = lastSet[0].insertId;
    }
  }

  const metaResult = {
    insertId: insertId,
    affectedRows: result.rowsAffected ? result.rowsAffected[0] : 0,
    rowsAffected: result.rowsAffected
  };

  return [rows, metaResult];
};

const query = async (queryStr, params = []) => {
  const pool = await poolPromise;
  return executeQuery(pool, queryStr, params);
};

const getConnection = async () => {
  const pool = await poolPromise;
  const transaction = pool.transaction();
  let inTransaction = false;

  return {
    query: async (queryStr, params = []) => {
      const executor = inTransaction ? transaction : pool;
      return executeQuery(executor, queryStr, params);
    },
    beginTransaction: async () => {
      await transaction.begin();
      inTransaction = true;
    },
    commit: async () => {
      if (inTransaction) {
        await transaction.commit();
        inTransaction = false;
      }
    },
    rollback: async () => {
      if (inTransaction) {
        await transaction.rollback();
        inTransaction = false;
      }
    },
    release: () => {
      // Dummy release wrapper
    }
  };
};

module.exports = {
  sql,
  poolPromise,
  query,
  getConnection,
  convertMysqlToMssql
};
