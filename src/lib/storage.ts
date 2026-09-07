import { get, set, del, keys, createStore } from 'idb-keyval';
import { Card, Deck, AppSettings } from '../types';

/**
 * Storage Layer for YaadKaro.
 * MANDATE: No code outside src/lib/storage.ts may touch IndexedDB or localStorage.
 */

const DB_NAME = 'yaadkaro-db';
const STORE_NAME = 'yaadkaro-store';

const customStore = createStore(DB_NAME, STORE_NAME);

const KEYS = {
  DECKS: 'yaadkaro_decks',
  CARDS_PREFIX: 'yaadkaro_cards_',
  SETTINGS: 'yaadkaro_settings',
} as const;

export class StorageError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

export const defaultSettings: AppSettings = {
  theme: 'system',
  soundEnabled: true,
  hapticsEnabled: true,
};

export const storage = {
  /**
   * Decks Management
   */
  async getDecks(): Promise<Deck[]> {
    try {
      const data = await get<Deck[]>(KEYS.DECKS, customStore);
      return data || [];
    } catch (err) {
      throw new StorageError('Failed to load decks from persistent storage.', err);
    }
  },

  async saveDecks(decks: Deck[]): Promise<void> {
    try {
      await set(KEYS.DECKS, decks, customStore);
    } catch (err) {
      throw new StorageError('Failed to save decks to persistent storage.', err);
    }
  },

  /**
   * Cards Management
   */
  async getCardsForDeck(deckId: string): Promise<Card[]> {
    try {
      const key = `${KEYS.CARDS_PREFIX}${deckId}`;
      const data = await get<Card[]>(key, customStore);
      return data || [];
    } catch (err) {
      throw new StorageError(`Failed to load cards for deck: ${deckId}.`, err);
    }
  },

  async saveCardsForDeck(deckId: string, cards: Card[]): Promise<void> {
    try {
      const key = `${KEYS.CARDS_PREFIX}${deckId}`;
      await set(key, cards, customStore);
    } catch (err) {
      throw new StorageError(`Failed to save cards for deck: ${deckId}.`, err);
    }
  },

  async deleteDeckCards(deckId: string): Promise<void> {
    try {
      const key = `${KEYS.CARDS_PREFIX}${deckId}`;
      await del(key, customStore);
    } catch (err) {
      throw new StorageError(`Failed to delete cards for deck: ${deckId}.`, err);
    }
  },

  /**
   * Settings & Preferences Management
   */
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await get<AppSettings>(KEYS.SETTINGS, customStore);
      return data ? { ...defaultSettings, ...data } : defaultSettings;
    } catch (err) {
      // Return default if error, but warn explicitly
      console.error('StorageError reading settings:', err);
      return defaultSettings;
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await set(KEYS.SETTINGS, settings, customStore);
    } catch (err) {
      throw new StorageError('Failed to save settings to storage.', err);
    }
  },

  /**
   * Get all storage keys for maintenance or export
   */
  async getAllKeys(): Promise<IDBValidKey[]> {
    try {
      return await keys(customStore);
    } catch (err) {
      throw new StorageError('Failed to retrieve storage keys.', err);
    }
  },
};
