import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { seedMenuItems } from './seed.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, '../data.sqlite')
let db

export function initDb() {
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  
  createTables()
  seedMenuItems()
  
  return db
}

export function getDb() {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
  }
  return db
}

function createTables() {
  // Menu items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price_cents INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Menu comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_item_id INTEGER NOT NULL,
      display_name TEXT DEFAULT 'Anonymous',
      rating INTEGER,
      body TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      flag_reason TEXT,
      ip_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
    )
  `)

  // Reservations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      party_size INTEGER NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'confirmed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_menu_comments_item ON menu_comments(menu_item_id, status, created_at)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reservations_date_time ON reservations(date, time)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date)`)

  console.log('✓ Database schema created and indexes added')
}

export default { initDb, getDb }