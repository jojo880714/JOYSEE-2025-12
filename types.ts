export enum GameStage {
  LOBBY = 'LOBBY',
  PAIRED = 'PAIRED',
  REVEALED = 'REVEALED'
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  budgetMin: number;
  budgetMax: number;
  allowHandmade: boolean;
  isLocked: boolean;
  stage: GameStage;
  createdAt: number;
}

export interface User {
  id: string;
  roomId: string;
  name: string;
  color: string;
  occasion: string;
  feeling: string;
  isHost: boolean;
  isReady: boolean; // Meaning they filled out their preferences
}

export interface Pairing {
  roomId: string;
  angelId: string; // The giver
  masterId: string; // The receiver
}

export interface GiftSuggestion {
  item: string;
  reason: string;
}

export interface ApiError {
  message: string;
}