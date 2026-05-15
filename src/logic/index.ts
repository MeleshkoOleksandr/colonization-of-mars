/**
 * SHARED DATA TYPES AND ENUMS
 */

// --- CONSTANT for primary Language ---
export const PRIMARY_LANG = 'it';

// --- STYLES ---
export const BUTTON_STYLES =
  'w-full bg-[#00ff41] text-black py-4 font-black uppercase text-xl hover:bg-white transition-colors shadow-[0_0_15px_rgba(0,255,65,0.5)]';

// INTERFACES & TYPES
export interface Story {
  title: string;
  plot: string;
  language: string;
  photo: string;
}

export interface SurvivalItem {
  id: string;
  name: string;
  photo: string;
  idealPosition: number;
  description: string;
}

export interface ScoreEvaluation {
  threshold: number;
  message: string;
}

export interface UserResult {
  username: string;
  team: string;
  score: number;
  selections: string[];
}

// UI Localization
export interface Language {
  id: string;
  name: string;
  file: string;
}

export interface Localization {
  [key: string]: string; // Allows loc.any_key_name
}

// DATA TYPES (INTERFACES)
export interface Team {
  id: number;
  name: string;
  is_unlocked: boolean; // Lock result from player
  has_commander: boolean;
  is_archived: boolean;
  current_scenario: string;
  access_token: string;
}

export interface GameResult {
  id?: number;
  username: string;
  team_id: number; // Updated: using ID instead of name
  team_name?: string; // Added: for displaying name after JOIN
  score: number;
  selections: string[]; // Array of item IDs
  created_at?: Date;
  access_token: string;
}

// Global Modal System
export type ModalType = 'alert' | 'confirm' | 'prompt' | 'prompt-area';

export enum ModalMode {
  IDLE = 'IDLE',
  ADMIN_AUTH = 'ADMIN_AUTH',
  ADD_TEAM = 'ADD_TEAM',
  ADD_PLAYER = 'ADD_PLAYER',
}
