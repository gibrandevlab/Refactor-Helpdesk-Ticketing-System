const sql = require('mssql');
require('dotenv').config();

// ── Config ──────────────────────────────────────────────────────────────

const SCHEMA_NAME = process.env.DB_SCHEMA || 'project_sistem_magang_test';

const dbConfig = {
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

// ── MySQL -> MSSQL dialect converter ─────────────────────────────────────

const KNOWN_TABLES = [
  'approval_ticket', 'asset_department_history', 'asset_hardware', 'asset_hardware_detail',
  'asset_history', 'asset_holder_history', 'asset_software', 'asset_software_detail',
  'assignment_ticket', 'bagian_departemen', 'checklist_approval', 'checklist_template',
  'departemen', 'inventory', 'jabatan', 'karyawan', 'kategori', 'laporan_feedback',
  'list_ticket', 'preventive_schedule', 'schedule_asset', 'schedule_asset_claim',
  'sub_kategori', 'teknisi', 'ticket_chat', 'ticket_checklist_result',
  'ticket_progress_log', 'user', 'v_dashboard_summary'
];

const DATE_INTERVAL_UNITS = 'SECOND|MINUTE|HOUR|DAY|MONTH|YEAR';

/**
 * Builds one { regex, replacement } pair per known table so that queries
 * referencing a bare table name get the schema prefix injected
 * (e.g. `karyawan` -> `[schema].[karyawan]`).
 *
 * Compiled once at module load, not re-created on every query.
 */
function buildTableQualifiers(schemaName) {
  return KNOWN_TABLES.map(table => {
    const bracketedTable = table === 'user' ? '[user]' : `[${table}]`;
    return {
      regex: new RegExp(`\\b(FROM|JOIN|INTO|UPDATE|DELETE\\s+FROM)\\s+(\\[?${table}\\]?)\\b(?!\\.)`, 'gi'),
      replacement: `$1 [${schemaName}].${bracketedTable}`
    };
  });
}

const TABLE_QUALIFIERS = buildTableQualifiers(SCHEMA_NAME);

function qualifyTableNames(query) {
  return TABLE_QUALIFIERS.reduce(
    (q, { regex, replacement }) => q.replace(regex, replacement),
    query
  );
}

function convertBackticksToBrackets(query) {
  // `tabel` / `kolom` -> [tabel] / [kolom]
  return query.replace(/`([^`]+)`/g, '[$1]');
}

function convertDoubleQuotedStrings(query) {
  // "Aktif" -> 'Aktif'
  return query.replace(/"([^"\r\n]+)"/g, "'$1'");
}

function convertNow(query) {
  return query.replace(/\bNOW\(\)/gi, 'GETDATE()');
}

function convertCurdate(query) {
  return query.replace(/\bCURDATE\(\)/gi, 'CAST(GETDATE() AS DATE)');
}

function convertDateFormat(query) {
  return query
    .replace(/DATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'%Y-%m'\s*\)/gi, "FORMAT($1, 'yyyy-MM')")
    .replace(/DATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'%Y-%m-%d'\s*\)/gi, "FORMAT($1, 'yyyy-MM-dd')");
}

function convertDateAdd(query) {
  // DATE_ADD(col, INTERVAL n UNIT) -> DATEADD(unit, n, col)
  const pattern = new RegExp(
    `DATE_ADD\\s*\\(\\s*([^,]+)\\s*,\\s*INTERVAL\\s+(\\S+)\\s+(${DATE_INTERVAL_UNITS})\\s*\\)`,
    'gi'
  );
  return query.replace(pattern, (_, dateExpr, valExpr, unit) => `DATEADD(${unit.toLowerCase()}, ${valExpr}, ${dateExpr})`);
}

function convertSumEquals(query) {
  // SUM(kolom = 'nilai') -> SUM(CASE WHEN kolom = 'nilai' THEN 1 ELSE 0 END)
  return query
    .replace(/\bSUM\s*\(\s*([a-zA-Z0-9_.]+)\s*=\s*'([^']+)'\s*\)/gi, "SUM(CASE WHEN $1 = '$2' THEN 1 ELSE 0 END)")
    .replace(/\bSUM\s*\(\s*([a-zA-Z0-9_.]+)\s*=\s*(\d+)\s*\)/gi, "SUM(CASE WHEN $1 = $2 THEN 1 ELSE 0 END)");
}

function convertOrderByField(query) {
  // ORDER BY FIELD(col, 'A', 'B') -> ORDER BY CASE col WHEN 'A' THEN 1 WHEN 'B' THEN 2 ELSE 99 END
  return query.replace(/ORDER\s+BY\s+FIELD\s*\(\s*([a-zA-Z0-9_.]+)\s*,\s*([^)]+)\)/gi, (_, column, valuesStr) => {
    const values = valuesStr.split(',').map(v => v.trim());
    const cases = values.map((v, i) => `WHEN ${v} THEN ${i + 1}`).join(' ');
    return `ORDER BY CASE ${column} ${cases} ELSE 99 END`;
  });
}

function convertGroupConcat(query) {
  // GROUP_CONCAT(...) -> STRING_AGG(...)
  const pattern = /GROUP_CONCAT\s*\(\s*(?:DISTINCT\s+)?(?:DATE\s*\(\s*([^)]+)\s*\)|([^)]+?))\s*(?:ORDER\s+BY\s+[^)]+?)?\s+SEPARATOR\s+(['"][^'"]*['"])\s*\)/gi;
  return query.replace(pattern, (_, dateColumn, plainColumn, separator) => {
    const column = dateColumn ? `CAST(${dateColumn} AS DATE)` : plainColumn.trim();
    return `STRING_AGG(CAST(${column} AS VARCHAR(MAX)), ${separator})`;
  });
}

function convertInsertIgnore(query) {
  // INSERT IGNORE INTO tbl (cols) VALUES (vals) -> IF NOT EXISTS (...) INSERT INTO ...
  return query.replace(
    /INSERT\s+IGNORE\s+INTO\s+([a-zA-Z0-9_[\].]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/gi,
    (_, table, columnsStr, valuesStr) => {
      const columns = columnsStr.split(',').map(c => c.trim());
      const values = valuesStr.split(',').map(v => v.trim());
      const conditions = columns.map((c, i) => `${c} = ${values[i] || 'NULL'}`).join(' AND ');
      return `IF NOT EXISTS (SELECT 1 FROM ${table} WHERE ${conditions}) INSERT INTO ${table} (${columnsStr}) VALUES (${valuesStr})`;
    }
  );
}

function convertLimitToTop(query) {
  // SELECT ... LIMIT n -> SELECT TOP n ...
  return query.replace(/\bSELECT\s+(?!TOP\b)([\s\S]+?)\s+LIMIT\s+(\d+)(\s*[);]?)/gi, 'SELECT TOP $2 $1$3');
}

function convertSubstring(query) {
  return query.replace(/SUBSTRING\s*\(\s*([^,)]+)\s*,\s*([^,)]+)\s*\)/gi, 'SUBSTRING($1, $2, 8000)');
}

function convertUnsigned(query) {
  return query.replace(/\bAS\s+UNSIGNED\b/gi, 'AS INT');
}

function convertMysqlToMssql(queryStr) {
  if (!queryStr || typeof queryStr !== 'string') return queryStr;

  let query = queryStr;
  query = convertBackticksToBrackets(query);
  query = qualifyTableNames(query);
  query = convertDoubleQuotedStrings(query);
  query = convertNow(query);
  query = convertCurdate(query);
  query = convertDateFormat(query);
  query = convertDateAdd(query);
  query = convertSumEquals(query);
  query = convertOrderByField(query);
  query = convertGroupConcat(query);
  query = convertInsertIgnore(query);
  query = convertLimitToTop(query);
  query = convertSubstring(query);
  query = convertUnsigned(query);

  return query;
}

// ── Connection pool ───────────────────────────────────────────────────────

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log(`✅ Connected to Microsoft SQL Server (${dbConfig.server}:${dbConfig.port}/${dbConfig.database})`);
    return pool;
  })
  .catch(err => {
    console.error('❌ SQL Server Connection Failed:', err.message);
    throw err;
  });

// ── Query execution ───────────────────────────────────────────────────────

/**
 * Replaces `?` placeholders in order with named mssql request parameters
 * (@p0, @p1, ...) and binds each value to the request.
 */
function bindPositionalParams(request, query, params) {
  let index = 0;
  return query.replace(/\?/g, () => {
    const paramName = `p${index}`;
    request.input(paramName, params[index]);
    index += 1;
    return `@${paramName}`;
  });
}

/**
 * Appends a SCOPE_IDENTITY() select to INSERT statements so callers can
 * read back the generated identity value, unless the query already uses
 * OUTPUT INSERTED itself.
 */
function withInsertId(query) {
  const isInsert = /^\s*INSERT\s+INTO/i.test(query);
  const alreadyReturnsOutput = /OUTPUT\s+INSERTED/i.test(query);
  return isInsert && !alreadyReturnsOutput
    ? `${query}; SELECT SCOPE_IDENTITY() AS insertId;`
    : query;
}

function extractInsertId(result) {
  if (!result.recordsets || result.recordsets.length < 2) return null;
  const lastRecordset = result.recordsets[result.recordsets.length - 1];
  return lastRecordset?.[0]?.insertId ?? null;
}

async function executeQuery(executor, queryStr, params = []) {
  const request = executor.request();

  let query = convertMysqlToMssql(queryStr);
  query = withInsertId(query);
  query = bindPositionalParams(request, query, params);

  const result = await request.query(query);

  const meta = {
    insertId: extractInsertId(result),
    affectedRows: result.rowsAffected?.[0] ?? 0,
    rowsAffected: result.rowsAffected
  };

  return [result.recordset || [], meta];
}

async function query(queryStr, params = []) {
  const pool = await poolPromise;
  return executeQuery(pool, queryStr, params);
}

async function getConnection() {
  const pool = await poolPromise;
  const transaction = pool.transaction();
  let inTransaction = false;

  return {
    query: (queryStr, params = []) => executeQuery(inTransaction ? transaction : pool, queryStr, params),

    beginTransaction: async () => {
      await transaction.begin();
      inTransaction = true;
    },

    commit: async () => {
      if (!inTransaction) return;
      await transaction.commit();
      inTransaction = false;
    },

    rollback: async () => {
      if (!inTransaction) return;
      await transaction.rollback();
      inTransaction = false;
    },

    release: () => {
      // No-op: kept only for API compatibility with mysql2-style pool connections.
    }
  };
}

module.exports = {
  sql,
  poolPromise,
  query,
  getConnection,
  convertMysqlToMssql
};
