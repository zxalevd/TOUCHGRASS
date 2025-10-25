-- SQLite schema for MVP app
-- Tables: users, sets, imgs, leaderboard
-- Run with: sqlite3 db/main.db < db/schema.sql
PRAGMA foreign_keys = ON;

BEGIN;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    time_limit INTEGER, -- seconds, NULL = no limit
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS imgs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL, -- file path or URL
    lat REAL,           -- latitude (nullable)
    lng REAL,           -- longitude (nullable)
    title TEXT,
    hint TEXT,
    set_id INTEGER NOT NULL,
    seq_no INTEGER,     -- ordering within set
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    set_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (set_id, user_id)
);

CREATE TABLE IF NOT EXISTS evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL, -- file path or URL
    lat REAL,           -- latitude (nullable)
    lng REAL,           -- longitude (nullable)
    user_id INTEGER NOT NULL, -- user who submitted
    img_id INTEGER NOT NULL,  -- associated image that this evidence is for
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (img_id) REFERENCES imgs(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_imgs_set_id ON imgs (set_id);
CREATE INDEX IF NOT EXISTS idx_sets_creator_id ON sets (creator_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_set_id ON leaderboard (set_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard (user_id);

COMMIT;