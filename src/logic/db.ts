import { neon } from '@neondatabase/serverless';
import { Team, GameResult } from '.'; 
/**
 * DATABASE CONFIGURATION
 * The 'neon' function automatically looks for the POSTGRES_URL 
 * inside your .env.local file.
 */
const sql = neon(process.env.POSTGRES_URL!);

/// DATABASE FUNCTIONS
/**
 * Fetches all results and joins with teams to get the team names
 */
export async function fetchAllResults(): Promise<GameResult[]> {
  const rows = await sql`
    SELECT r.*, t.name as team_name
    FROM mars_mission.results r
    JOIN mars_mission.teams t ON r.team_id = t.id
    ORDER BY r.score ASC
  `;
  return rows as unknown as GameResult[];
}

/**
 * Saves the player's result using the selected team_id
 */
export async function saveGameResult(result: { username: string, team_id: number, score: number, selections: string[] }) {
  await sql
    `INSERT INTO mars_mission.results (username, team_id, score, selections)
    VALUES (${result.username}, ${result.team_id}, ${result.score}, ${JSON.stringify(result.selections)})`
  ;
}

/**
 * Fetches the list of teams for the dropdown menu
 */
export async function fetchTeams(): Promise<Team[]> {
  const rows = await sql`SELECT * FROM mars_mission.teams ORDER BY id ASC`;
  return rows as unknown as Team[];
}

/**
 * Add a new team (Admin Panel)
 * Adds a team name to the database if it doesn't already exist.
 */
export async function addTeam(name: string, scenarioId: string) {
  await sql`INSERT INTO mars_mission.teams (name, current_scenario) VALUES (${name}, ${scenarioId})`;
}

/**
 * Delete a team (Admin Panel)
 * Removes a team from the database by its ID.
 */
export async function deleteTeam(id: number) {
  await sql`DELETE FROM mars_mission.teams WHERE id = ${id}`;
}

/**
 * Delete a result (Admin Panel)
 * Removes a specific player's result from the database.
 */
export async function deleteResult(id: number) {
  await sql`DELETE FROM mars_mission.results WHERE id = ${id}`;
}

/**
 * Delete all result (Admin Panel)
 * Removes all result from the database.
 */
export async function deleteAllResults() {
  await sql`DELETE FROM mars_mission.results`;
}

// Function to toggle unlock status
export async function setTeamUnlockStatus(teamId: number, status: boolean) {
  await sql`UPDATE mars_mission.teams SET is_unlocked = ${status} WHERE id = ${teamId}`;
}

// Function to check specific team status
export async function getTeamStatus(teamId: number): Promise<boolean> {
  const result = await sql`SELECT is_unlocked FROM mars_mission.teams WHERE id = ${teamId}`;
  return result[0]?.is_unlocked || false;
}

/**
 * Deletes all results associated with a specific team ID
 */
export async function deleteResultsByTeam(teamId: number) {
  await sql`DELETE FROM mars_mission.results WHERE team_id = ${teamId}`;
}

// Toggle commander status for a team
export async function setCommanderStatus(teamId: number, status: boolean) {
  await sql`UPDATE mars_mission.teams SET has_commander = ${status} WHERE id = ${teamId}`;
}

// Create multiple players with new team
export async function addTeamWithPlayers(name: string, scenarioId: string, playerNames: string[]) {
  // 1. Create the team
  const teamResult = await sql`
    INSERT INTO mars_mission.teams (name, current_scenario) 
    VALUES (${name}, ${scenarioId}) 
    RETURNING id
  `;
  const teamId = teamResult[0].id;

  // 2. Create player records with score -1
  for (const playerName of playerNames) {
    if (playerName.trim()) {
      await sql`
        INSERT INTO mars_mission.results (username, team_id, score) 
        VALUES (${playerName.trim()}, ${teamId}, -1)
      `;
    }
  }
}

 // Updates an existing player's record when they finish the game
export async function updatePlayerResult(username: string, teamId: number, score: number, selections: string[]) {
  await sql`
    UPDATE mars_mission.results 
    SET score = ${score}, selections = ${JSON.stringify(selections)}, created_at = NOW()
    WHERE username = ${username} AND team_id = ${teamId} AND score = -1
  `;
}

/**
 * Adds a single pending player to an existing team.
 */
export async function addSinglePlayer(teamId: number, playerName: string) {
  await sql`
    INSERT INTO mars_mission.results (username, team_id, score, selections) 
    VALUES (${playerName.trim()}, ${teamId}, -1, '[]'::jsonb)
  `;
}

/**
 * DANGER: Deletes all teams and, consequently, all results (via CASCADE).
 */
export async function wipeEntireDatabase() {
  await sql`DELETE FROM mars_mission.teams`;
}

/**
 * Set Archive status for selected team.
 */
export async function setTeamArchiveStatus(teamId: number, status: boolean) {
  await sql`UPDATE mars_mission.teams SET is_archived = ${status} WHERE id = ${teamId}`;
}

/**
 * Wipes teams and results based on their archive status.
 */
export async function wipeTeamsByStatus(isArchived: boolean) {
  await sql`DELETE FROM mars_mission.teams WHERE is_archived = ${isArchived}`;
}

/**
 * Select functions based on tokens rather than IDs to ensure access
 */
export async function getTeamByToken(token: string) {
  const result = await sql`SELECT * FROM mars_mission.teams WHERE access_token = ${token} AND is_archived = false`;
  return result[0] || null;
}

export async function getPlayerByToken(token: string) {
  const result = await sql`
    SELECT r.*, t.is_archived, t.is_unlocked 
    FROM mars_mission.results r 
    JOIN mars_mission.teams t ON r.team_id = t.id 
    WHERE r.access_token = ${token} AND t.is_archived = false
  `;
  return result[0] || null;
}