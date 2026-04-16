import { neon } from '@neondatabase/serverless';
/**
 * DATABASE CONFIGURATION
 * The 'neon' function automatically looks for the POSTGRES_URL 
 * inside your .env.local file.
 */
const sql = neon(process.env.POSTGRES_URL!);

 //   DATA TYPES (INTERFACES)
export interface Team {
  id: number;
  name: string;
  is_unlocked: boolean; // Lock result from player
}

export interface GameResult {
  id?: number;
  username: string;
  team_id: number;     // Updated: using ID instead of name
  team_name?: string;  // Added: for displaying name after JOIN
  score: number;
  selections: string[]; // Array of item IDs
  created_at?: Date;
}

///   DATABASE FUNCTIONS
/**
 * Fetches all results and joins with teams to get the team names
 */
export async function fetchAllResults(): Promise<GameResult[]> {
  const rows = await sql`
    SELECT r.*, t.name as team_name
    FROM results r
    JOIN teams t ON r.team_id = t.id
    ORDER BY r.score ASC
  `;
  return rows as unknown as GameResult[];
}

/**
 * Saves the player's result using the selected team_id
 */
export async function saveGameResult(result: { username: string, team_id: number, score: number, selections: string[] }) {
  await sql
    `INSERT INTO results (username, team_id, score, selections)
    VALUES (${result.username}, ${result.team_id}, ${result.score}, ${JSON.stringify(result.selections)})`
  ;
}

/**
 * Fetches the list of teams for the dropdown menu
 */
export async function fetchTeams(): Promise<Team[]> {
  const rows = await sql`SELECT * FROM teams ORDER BY id ASC`;
  return rows as unknown as Team[];
}

/**
 * 4. Add a new team (Admin Panel)
 * Adds a team name to the database if it doesn't already exist.
 */
export async function addTeam(name: string) {
  await sql`INSERT INTO teams (name) VALUES (${name}) ON CONFLICT DO NOTHING`;
}

/**
 * 5. Delete a team (Admin Panel)
 * Removes a team from the database by its ID.
 */
export async function deleteTeam(id: number) {
  await sql`DELETE FROM teams WHERE id = ${id}`;
}

/**
 * 6. Delete a result (Admin Panel)
 * Removes a specific player's result from the database.
 */
export async function deleteResult(id: number) {
  await sql`DELETE FROM results WHERE id = ${id}`;
}

/**
 * 7. Delete all result (Admin Panel)
 * Removes all result from the database.
 */
export async function deleteAllResults() {
  await sql`DELETE FROM results`;
}

// Function to toggle unlock status
export async function setTeamUnlockStatus(teamId: number, status: boolean) {
  await sql`UPDATE teams SET is_unlocked = ${status} WHERE id = ${teamId}`;
}

// Function to check specific team status
export async function getTeamStatus(teamId: number): Promise<boolean> {
  const result = await sql`SELECT is_unlocked FROM teams WHERE id = ${teamId}`;
  return result[0]?.is_unlocked || false;
}