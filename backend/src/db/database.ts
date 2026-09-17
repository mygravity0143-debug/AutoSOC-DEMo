import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'autosoc.db');

export const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('[Database] Connected to SQLite database at', DB_PATH);
  }
});

export const runQuery = (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const getOne = <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
};

export const getAll = <T>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve((rows || []) as T[]);
    });
  });
};

export async function initDatabase() {
  // Create tables according to spec
  await runQuery(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      vin TEXT NOT NULL UNIQUE,
      model TEXT NOT NULL,
      software_version TEXT NOT NULL,
      ecu_count INTEGER NOT NULL,
      can_interface TEXT NOT NULL,
      risk_score INTEGER NOT NULL DEFAULT 15,
      security_status TEXT NOT NULL DEFAULT 'SECURE',
      last_seen TEXT NOT NULL
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS ecus (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      firmware_version TEXT NOT NULL,
      message_rate INTEGER NOT NULL DEFAULT 50,
      security_status TEXT NOT NULL DEFAULT 'SECURE',
      last_event TEXT NOT NULL,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS can_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      ecu_id TEXT NOT NULL,
      can_id TEXT NOT NULL,
      dlc INTEGER NOT NULL,
      data TEXT NOT NULL,
      message_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NORMAL'
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS security_events (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      ecu_id TEXT NOT NULL,
      can_id TEXT NOT NULL,
      threat_type TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL,
      risk_score INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'DETECTED'
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL,
      ecu_id TEXT NOT NULL,
      threat_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      risk_score INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      description TEXT NOT NULL
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS vulnerabilities (
      id TEXT PRIMARY KEY,
      ecu_name TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL,
      cvss_score REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      remediation TEXT NOT NULL
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      vehicle_id TEXT NOT NULL,
      ecu_id TEXT NOT NULL,
      severity TEXT NOT NULL,
      risk_score INTEGER NOT NULL,
      created_time TEXT NOT NULL,
      assigned_analyst TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      timeline_json TEXT,
      notes TEXT,
      resolution TEXT
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0
    )
  `);

  console.log('[Database] Schema initialized successfully.');
}
