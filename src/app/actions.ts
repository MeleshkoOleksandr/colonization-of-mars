"use server";

import * as db from "../../lib/db";
import { revalidatePath } from "next/cache";

/**
 * SERVER ACTIONS
 * These functions run only on the server. 
 * They act as a secure bridge between the UI and the Database.
 */

//  Get the list of teams for the login screen
export async function getTeamsAction() {
//  const teams = await db.fetchTeams();
//  console.log("SERVER ACTION: Teams fetched from DB:", teams); // Checking DB
  return await db.fetchTeams();
}

// Save a player's game result
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

//  Get all results for the leaderboard
export async function getResultsAction() {
  return await db.fetchAllResults();
}

//  Admin: Add a new team
export async function addTeamAction(name: string) {
  await db.addTeam(name);
  revalidatePath("/");
}

//  Admin: Delete a team (and its results thanks to CASCADE)
export async function deleteTeamAction(id: number) {
  await db.deleteTeam(id);
  revalidatePath("/");
}

//  Admin: action to delete a result and refresh the cache
export async function deleteResultAction(id: number) {
  await db.deleteResult(id);
// This tells Next.js to update the data for all users
  revalidatePath("/");
}

//  Admin: action to delete all result and refresh the cache
export async function deleteAllResultsAction() {
  await db.deleteAllResults();
  revalidatePath("/");
}

//  Action to change team status from Admin panel
export async function updateTeamStatusAction(teamId: number, status: boolean) {
  await db.setTeamUnlockStatus(teamId, status);
  revalidatePath("/");
}

// Action for players to check if they can see results
export async function checkTeamStatusAction(teamId: number) {
  return await db.getTeamStatus(teamId);
}

// Action for deleting all results associated with a specific team ID
export async function deleteResultsByTeamAction(teamId: number) {
  await db.deleteResultsByTeam(teamId);
  revalidatePath("/");
}

//  Action to change Commander status for selected team
export async function updateCommanderStatusAction(teamId: number, status: boolean) {
  await db.setCommanderStatus(teamId, status);
  revalidatePath("/");
}

//  Action to check Commander status for selected team
export async function checkCommanderStatusAction(teamId: number) {
  const teams = await db.fetchTeams();
  return teams.find(t => t.id === teamId)?.has_commander || false;
}