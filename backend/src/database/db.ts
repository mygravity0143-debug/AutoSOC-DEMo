import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'autosoc.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('[Database] Failed to open legacy sqlite database:', err.message);
  }
});

export default db;

export const legacyDbPath = DB_PATH;
