// DATA LAYER: db.ts
// This file connects to our SQLite database and creates the tables.

import { DB } from "https://deno.land/x/sqlite/mod.ts";

// Create or open the local database file
const db = new DB("theater.db");

// Creating tblShow based on my individual schema design.
// I used INTEGER for IsActive because SQLite doesn't have a true BOOLEAN type.
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

// Check if the table is empty
const countResult = db.query("SELECT COUNT(*) FROM tblShow")[0][0] as number;

// If empty, insert some test data automatically for testing purposes
if (countResult === 0) {
  console.log("Database is empty. Inserting test data...");

  const testShows = [
    ["Hamlet - Opening Night", "2026-12-05", 55.00, 120, 1],
    ["The Phantom", "2026-12-12", 75.50, 85, 1],
    ["Comedy Night", "2026-12-18", 30.00, 150, 1],
    ["Old Cancelled Show", "2026-11-30", 50.00, 0, 0], // 0 means deactivated
  ];

  for (const show of testShows) {
    db.query(
      "INSERT INTO tblShow (ShowTitle, ShowDate, TicketPrice, AvailableSeats, IsActive) VALUES (?, ?, ?, ?, ?)",
      show,
    );
  }
}

console.log("Database connected successfully.");

export default db;
