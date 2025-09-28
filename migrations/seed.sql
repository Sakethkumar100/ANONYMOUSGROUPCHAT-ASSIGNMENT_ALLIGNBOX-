-- migrations/seed.sql
-- Drop child tables first to avoid FK constraint issues (safe on re-run)
DROP TABLE IF EXISTS read_receipts;
DROP TABLE IF EXISTS user_presence;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS chat_groups;
DROP TABLE IF EXISTS users;

-- (Optional) create DB and use it — your JS script already creates DB and changeUser(),
-- but keeping these here is harmless because the script strips CREATE DATABASE/USE before executing.
CREATE DATABASE IF NOT EXISTS chatui;
USE chatui;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    avatar_url VARCHAR(500),
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat groups table (renamed from "groups" to avoid reserved-word issues)
CREATE TABLE IF NOT EXISTS chat_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('member', 'admin') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_membership (group_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    text TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    status ENUM('sent', 'read') DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User presence table for online status
CREATE TABLE IF NOT EXISTS user_presence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    group_id INT NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    last_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
    UNIQUE KEY unique_presence (user_id, group_id)
);

-- Read receipts table
CREATE TABLE IF NOT EXISTS read_receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_receipt (message_id, user_id)
);

-- Seed data
INSERT IGNORE INTO users (name, avatar_url) VALUES 
('alice', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice'),
('bob', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'),
('charlie', 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie');

INSERT IGNORE INTO chat_groups (title) VALUES ('General');

-- Add users to the default group (assumes chat_groups.id = 1)
INSERT IGNORE INTO group_members (group_id, user_id) 
SELECT 1, id FROM users WHERE name IN ('alice', 'bob', 'charlie');

-- Sample messages
INSERT IGNORE INTO messages (group_id, user_id, text, is_anonymous) VALUES
(1, 1, 'Hey everyone! Welcome to the General chat!', FALSE),
(1, 2, 'Thanks alice! Excited to be here.', FALSE),
(1, 3, 'This is a test anonymous message', TRUE),
(1, 1, 'How is everyone doing today?', FALSE);
