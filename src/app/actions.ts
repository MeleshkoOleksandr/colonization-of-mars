"use server";

import * as db from "../../lib/db";
import { revalidatePath } from "next/cache";

/**
 * SERVER ACTIONS
 * These functions run only on the server. 
 * They act as a secure bridge between the UI and the Database.
 */

// 1. Get the list of teams for the login screen
export async function getTeamsAction() {
  const teams = await db.fetchTeams();
  console.log("SERVER ACTION: Teams fetched from DB:", teams); // Check your VS Code terminal
  return await db.fetchTeams();
}

// 2. Save a player's game result
export async function saveResultAction(data: {
  username: string;
  team_id: number;
  score: number;
  selections: string[];
}) {
  await db.saveGameResult(data);
  // Tell Next.js to clear the cache so the leaderboard updates instantly
  revalidatePath("/"); 
}

// 3. Get all results for the leaderboard
export async function getResultsAction() {
  return await db.fetchAllResults();
}

// 4. Admin: Add a new team
export async function addTeamAction(name: string) {
  await db.addTeam(name);
  revalidatePath("/");
}

// 5. Admin: Delete a team (and its results thanks to CASCADE)
export async function deleteTeamAction(id: number) {
  await db.deleteTeam(id);
  revalidatePath("/");
}

// 6. Admin: action to delete a result and refresh the cache
export async function deleteResultAction(id: number) {
  await db.deleteResult(id);
  // This tells Next.js to update the data for all users
  revalidatePath("/");
}