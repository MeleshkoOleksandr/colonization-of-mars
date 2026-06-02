import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { Pool } from 'pg';
import { Team, GameResult} from './';

/**
 * DATABASE CONNECTION CONFIGURATION
 * Logic to switch between Neon (HTTP) and Standard Postgres (TCP/Docker)
 */
const connectionString = process.env.POSTGRES_URL!;
const isNeon = connectionString.includes('neon.tech');

// Initialize the appropriate driver
const pool = !isNeon ? new Pool({ connectionString }) : null;
const sqlNeon = isNeon ? neon(connectionString) : null;

/**
 * UNIVERSAL QUERY EXECUTOR
 * Normalizes the behavior of different database drivers.
 */
async function query(sql: string, params: any[] = []) {
  if (isNeon && sqlNeon) {
    // Neon Serverless (HTTP)
    return await sqlNeon.query(sql, params);
  } else {
    // Standard Postgres (TCP/Docker)
    const res = await pool!.query(sql, params);
    return res.rows;
  }
}

//                                             --- DATABASE FUNCTIONS ---

/**
 * Fetches all teams ordered by ID
 */
export async function fetchTeams(): Promise<Team[]> {
  const rows = await query('SELECT * FROM mars_mission.teams ORDER BY id ASC');
  return rows as Team[];
}

/**
 * Fetches all results and joins with teams to get the team names
 */
export async function fetchAllResults(): Promise<GameResult[]> {
  const rows = await query(`
    SELECT r.*, t.name as team_name
    FROM mars_mission.results r
    JOIN mars_mission.teams t ON r.team_id = t.id
    ORDER BY r.score ASC
  `);
  return rows as GameResult[];
}

/**
 * Saves a new game result (used mainly for Commander inserts)
 */
export async function saveGameResult(result: { username: string; team_id: number; score: number; selections: string[] }) {
  await query(
    'INSERT INTO mars_mission.results (username, team_id, score, selections) VALUES ($1, $2, $3, $4)',
    [result.username, result.team_id, result.score, JSON.stringify(result.selections)]
  );
}

/**
 * Updates an existing player's record when they finish the game
 */
export async function updatePlayerResult(username: string, team_id: number, score: number, selections: string[]) {
  await query(
    'UPDATE mars_mission.results SET score = $1, selections = $2, created_at = NOW() WHERE username = $3 AND team_id = $4 AND score = -1',
    [score, JSON.stringify(selections), username, team_id]
  );
}

/**
 * Creates a team and pre-registers multiple players
 */
export async function addTeamWithPlayers(name: string, scenarioId: string, playerNames: string[]) {
  // 1. Create the team and get the ID
  const teamResult = await query(
    'INSERT INTO mars_mission.teams (name, current_scenario) VALUES ($1, $2) RETURNING id',
    [name, scenarioId]
  );
  const teamId = teamResult[0].id;

  // 2. Create player records with initial score -1
  for (const pName of playerNames) {
    if (pName.trim()) {
      await query(
        'INSERT INTO mars_mission.results (username, team_id, score, selections) VALUES ($1, $2, -1, $3)',
        [pName.trim(), teamId, JSON.stringify([])]
      );
    }
  }
}

/**
 * Adds a single pending player to an existing team
 */
export async function addSinglePlayer(teamId: number, playerName: string) {
  await query(
    'INSERT INTO mars_mission.results (username, team_id, score, selections) VALUES ($1, $2, -1, $3)',
    [playerName.trim(), teamId, JSON.stringify([])]
  );
}

/**
 * Toggles result visibility for a specific team
 */
export async function setTeamUnlockStatus(teamId: number, status: boolean) {
  await query('UPDATE mars_mission.teams SET is_unlocked = $1 WHERE id = $2', [status, teamId]);
}

/**
 * Checks if a team has unlocked their results
 */
export async function getTeamStatus(teamId: number): Promise<boolean> {
  const result = await query('SELECT is_unlocked FROM mars_mission.teams WHERE id = $1', [teamId]);
  return result[0]?.is_unlocked || false;
}

/**
 * Toggles the Commander flag for a team
 */
export async function setCommanderStatus(teamId: number, status: boolean) {
  await query('UPDATE mars_mission.teams SET has_commander = $1 WHERE id = $2', [status, teamId]);
}

/**
 * Sets the Archive status for a selected team
 */
export async function setTeamArchiveStatus(teamId: number, status: boolean) {
  await query('UPDATE mars_mission.teams SET is_archived = $1 WHERE id = $2', [status, teamId]);
}

/**
 * Deletes a team and all associated results (via CASCADE)
 */
export async function deleteTeam(id: number) {
  await query('DELETE FROM mars_mission.teams WHERE id = $1', [id]);
}

/**
 * Removes a specific player result
 */
export async function deleteResult(id: number) {
  await query('DELETE FROM mars_mission.results WHERE id = $1', [id]);
}

/**
 * Clears all results from the database
 */
export async function deleteAllResults() {
  await query('DELETE FROM mars_mission.results');
}

/**
 * Deletes all results associated with a specific team
 */
export async function deleteResultsByTeam(teamId: number) {
  await query('DELETE FROM mars_mission.results WHERE team_id = $1', [teamId]);
}

/**
 * Wipes teams based on their archive status
 */
export async function wipeTeamsByStatus(isArchived: boolean) {
  await query('DELETE FROM mars_mission.teams WHERE is_archived = $1', [isArchived]);
}

/**
 * Security: Fetch team by unique access token
 */
export async function getTeamByToken(token: string) {
  const result = await query('SELECT * FROM mars_mission.teams WHERE access_token = $1 AND is_archived = false', [token]);
  return result[0] || null;
}

/**
 * Security: Fetch player by unique access token
 */
export async function getPlayerByToken(token: string) {
  const result = await query(`
    SELECT r.*, t.is_archived, t.is_unlocked 
    FROM mars_mission.results r 
    JOIN mars_mission.teams t ON r.team_id = t.id 
    WHERE r.access_token = $1 AND t.is_archived = false
  `, [token]);
  return result[0] || null;
}

/**
 * System Configuration: Get setting by key
 */
export async function getSetting(key: string): Promise<string | null> {
  const result = await query('SELECT value FROM mars_mission.settings WHERE key = $1', [key]);
  return result[0]?.value || null;
}

/**
 * System Configuration: Update or create setting
 */
export async function updateSetting(key: string, value: string) {
  await query(`
    INSERT INTO mars_mission.settings (key, value)
    VALUES ($1, $2)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `, [key, value]);
}