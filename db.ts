import { DB } from "https://deno.land/x/sqlite/mod.ts";

// 1. Create or open the local SQLite database file
const db = new DB("theater.db");

// 2. Safely create your tblShow table
db.execute(`
  CREATE TABLE IF NOT EXISTS tblShow (
    ShowID INTEGER PRIMARY KEY AUTOINCREMENT,
    ShowTitle TEXT NOT NULL,
    ShowDate TEXT NOT NULL,
    TicketPrice REAL NOT NULL,
    AvailableSeats INTEGER NOT NULL,
    IsActive INTEGER DEFAULT 1
  )
`);

console.log("Database connected. tblShow is ready.");

export default db;
