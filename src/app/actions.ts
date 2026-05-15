"use server";

import bcrypt from 'bcryptjs';
import * as db from "../logic/db";
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
export async function addTeamAction(name: string, scenarioId: string) {
  await db.addTeam(name, scenarioId);
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

/**
 * Create a team and pre-register a list of players.
 * This is called from the Admin panel.
 */
export async function addTeamWithPlayersAction(teamName: string, scenarioId: string,  playerNames: string[]) {
  try {
    await db.addTeamWithPlayers(teamName, scenarioId, playerNames);
    // Clear the cache so the Login screen and Admin panel see the new team and players11
    revalidatePath("/"); 
  } catch (error) {
    console.error("Database Action Error [addTeamWithPlayers]:", error);
    throw new Error("Failed to create team with players");
  }
}

/**
 * Update a pending player's record with final scores.
 * This is called when a player finishes the mission.
 */
export async function updatePlayerResultAction(data: {username: string; team_id: number; score: number; selections: string[];}) {
  try {
    await db.updatePlayerResult( data.username, data.team_id, data.score, data.selections);
    // Clear the cache so the Leaderboard and Discussion lists update immediately
    revalidatePath("/");
  } catch (error) {
    console.error("Database Action Error [updatePlayerResult]:", error);
    throw new Error("Failed to update player results");
  }
}

//  Adds a single  player to an existing team without results.
export async function addSinglePlayerAction(teamId: number, playerName: string) {
  try {
    await db.addSinglePlayer(teamId, playerName);
    revalidatePath("/");
  } catch (error) {
    console.error("Failed to add player:", error);
    throw new Error("Database error");
  }
}

// Deletes all teams and all results
export async function wipeEntireDatabaseAction() {
  try {
    await db.wipeEntireDatabase();
    revalidatePath("/");
  } catch (error) {
    console.error("Wipe error:", error);
  }
}

// Deletes all teams and all results based on their archive status.
export async function wipeTeamsByStatusAction(isArchived: boolean) {
  try {
    await db.wipeTeamsByStatus(isArchived);
    revalidatePath("/");
  } catch (error) {
    console.error("Wipe error:", error);
  }
}

//Update archive status for team
export async function updateTeamArchiveStatusAction(teamId: number, status: boolean) {
  await db.setTeamArchiveStatus(teamId, status);
  revalidatePath("/");
}

/**
 * Verifies the admin password. 
 * Checks DB hash first, falls back to constant if DB is empty.
 */
export async function verifyAdminPasswordAction(input: string, fallback: string) {
  const storedHash = await db.getSetting('admin_password');
  
  if (!storedHash) {
    // If no password in DB yet, check against the hardcoded constant
    return input === fallback;
  }
  // Compare input with stored hash
  return await bcrypt.compare(input, storedHash);
}

/**
 * Hashes and saves a new admin password to the DB.
 */
export async function updateAdminPasswordAction(newPassword: string) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);
  await db.updateSetting('admin_password', hash);
  revalidatePath('/');
}