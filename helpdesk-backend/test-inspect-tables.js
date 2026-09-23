const db = require('./config/db');

async function inspectDb() {
  try {
    console.log('Inspecting SQL Server databases and tables...');
    const [dbs] = await db.query('SELECT name FROM sys.databases');
    console.log('Databases:', dbs.map(d => d.name));

    const [schemas] = await db.query('SELECT name FROM sys.schemas');
    console.log('Schemas in master:', schemas.map(s => s.name));

    const [tables] = await db.query('SELECT s.name AS schema_name, t.name AS table_name FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id');
    console.log('Tables in master:', tables);

    process.exit(0);
  } catch (err) {
    console.error('Inspection failed:', err.message);
    process.exit(1);
  }
}

inspectDb();
