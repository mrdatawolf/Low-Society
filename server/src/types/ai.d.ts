/**
 * TypeScript definitions for AI system
 * @module types/ai
 */

import type { PublicGameState, PrivateGameState, MoneyCard, ItemCard, ChatMode } from './game';

/**
 * AI decision type
 */
export type AIDecisionType = 'bid' | 'pass';

/**
 * AI decision interface
 */
export interface AIDecision {
  action: AIDecisionType;
  cards?: string[];
  reasoning?: string;
}

/**
 * AI player configuration
 */
export interface AIPlayerConfig {
  id: string;
  name: string;
  personality?: AIPersonality;
}

/**
 * AI personality traits
 */
export interface AIPersonality {
  aggression: number;      // 0-1: How aggressive in bidding
  risktaking: number;      // 0-1: Willingness to take risks
  valueAccuracy: number;   // 0-1: How accurately they value cards
}

/**
 * AI context for decision making
 */
export interface AIContext {
  publicState: PublicGameState;
  privateState: PrivateGameState;
  currentCard: ItemCard;
  highestBid: number;
  myPosition: number;
  playersRemaining: number;
}

/**
 * Tutorial message context
 */
export interface TutorialContext {
  bidAmount?: number;
  cardName?: string;
  cardType?: string;
  cardValue?: number;
  reasoning?: string;
}

/**
 * Commentary message context
 */
export interface CommentaryContext {
  playerName?: string;
  cardName?: string;
  cardType?: string;
  bidAmount?: number;
  event?: string;
}

/**
 * Story part interface
 */
export interface StoryPart {
  text: string;
  index: number;
}

/**
 * Story interface
 */
export interface Story {
  id: string;
  parts: string[];
}

/**
 * Story reaction interface
 */
export interface StoryReaction {
  reactor: {
    id: string;
    name: string;
  };
  message: string;
}

/**
 * Story system state
 */
export interface StorySystemState {
  activeStory: Story | null;
  storytellerId: string | null;
  currentPartIndex: number;
  lastReactorId: string | null;
  storyQueue: Story[];
}

/**
 * Chat timing configuration
 */
export interface ChatTimingConfig {
  perCharacterPause: number;
  finalPause: number;
  minDelay: number;
  maxDelay: number;
}

/**
 * AI chat message data
 */
export interface AIChatMessageData {
  playerId: string;
  playerName: string;
  message: string;
  duration: number;
  mode: ChatMode;
}

/**
 * Commentary event types
 */
export type CommentaryEvent =
  | 'HIGH_BID'
  | 'PLAYER_PASSED'
  | 'CARD_WON'
  | 'LOW_BID'
  | 'FIRST_BID'
  | 'LUXURY_ACQUIRED'
  | 'DISGRACE_ACQUIRED'
  | 'PRESTIGE_ACQUIRED'
  | 'GAME_START'
  | 'PLAYER_ELIMINATED'
  | 'PAWN_SHOP'
  | 'REPO_MAN';

/**
 * Message type determination result
 */
export interface MessageType {
  type: 'EVENT_COMMENTARY' | 'STORY' | 'JOKE' | 'NONE';
  probability: number;
}
