/**
 * MARS SURVIVAL DATABASE INITIALIZATION
 * Run this script in your Vercel Storage Query or local Postgres tool.
 */

-- 1. Drop tables if they exist (to start fresh if needed)
-- Note: Drop results first because it depends on teams (Foreign Key)
DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS teams;

-- 2. Create Teams Table
-- This stores the list of available teams
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  is_unlocked BOOLEAN DEFAULT false
);

-- 3. Create Results Table
-- Stores player scores and links them to teams via ID
CREATE TABLE results (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,

  -- Foreign Key: Links this result to a specific team
  -- ON DELETE CASCADE: If a team is deleted, all its results are also deleted
  team_id INT REFERENCES teams(id) ON DELETE CASCADE,
  
  score INT NOT NULL,              -- NASA Penalty Score (lower is better)
  selections JSONB NOT NULL,       -- Array of sorted item IDs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Seed Data
-- Add initial teams to the database
INSERT INTO teams (name) VALUES ('Alfa Centauri');
INSERT INTO teams (name) VALUES ('Marineris Rangers');
INSERT INTO teams (name) VALUES ('Olympus Mons');

/**
 * USEFUL QUERIES:
 * 
 * -- Get all results with team names:
 * SELECT results.*, teams.name as team_name 
 * FROM results 
 * JOIN teams ON results.team_id = teams.id 
 * ORDER BY score ASC;
 */