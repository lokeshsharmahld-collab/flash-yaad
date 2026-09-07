import { z } from 'zod';
import { RootState, RootStateSchema, Deck, Card, DeckSchema, CardSchema, CURRENT_SCHEMA_VERSION } from './schema';
import { getTodayDateString } from './leitner';

export const SingleDeckExportSchema = z.object({
  type: z.literal('yaadkaro_single_deck'),
  schemaVersion: z.number().int().min(1),
  exportedAt: z.string().datetime(),
  deck: DeckSchema,
  cards: z.array(CardSchema),
});

export type SingleDeckExport = z.infer<typeof SingleDeckExportSchema>;

/**
 * Triggers a browser download of a JSON string as a file.
 */
export function downloadJsonFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports full app data as pretty JSON file.
 */
export function exportFullData(state: RootState): void {
  const today = getTodayDateString();
  const filename = `yaadkaro-backup-${today}.json`;
  const jsonStr = JSON.stringify(state, null, 2);
  downloadJsonFile(jsonStr, filename);
}

/**
 * Exports a single deck and its cards.
 */
export function exportSingleDeck(deck: Deck, cards: Card[]): void {
  const deckCards = cards.filter((c) => c.deckId === deck.id && c.deletedAt === null);
  const payload: SingleDeckExport = {
    type: 'yaadkaro_single_deck',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    deck,
    cards: deckCards,
  };
  const safeName = deck.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
  const filename = `yaadkaro-deck-${safeName}-${getTodayDateString()}.json`;
  downloadJsonFile(JSON.stringify(payload, null, 2), filename);
}

export type ParseImportResult =
  | { type: 'full'; state: RootState }
  | { type: 'single_deck'; exportData: SingleDeckExport }
  | { type: 'error'; message: string };

/**
 * Validates and parses an imported file text.
 */
export function parseImportFile(jsonString: string, fileSize: number): ParseImportResult {
  // Enforce 10 MB limit
  const MAX_BYTES = 10 * 1024 * 1024;
  if (fileSize > MAX_BYTES) {
    return {
      type: 'error',
      message: 'File exceeds the maximum allowed size of 10 MB.',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return {
      type: 'error',
      message: 'Invalid JSON file: syntax error during parsing.',
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      type: 'error',
      message: 'File content is not a valid JSON object.',
    };
  }

  // Check if it's a single deck export
  const singleDeckCheck = SingleDeckExportSchema.safeParse(parsed);
  if (singleDeckCheck.success) {
    return {
      type: 'single_deck',
      exportData: singleDeckCheck.data,
    };
  }

  // Check if it's a full backup
  const fullCheck = RootStateSchema.safeParse(parsed);
  if (fullCheck.success) {
    return {
      type: 'full',
      state: fullCheck.data,
    };
  }

  // Generate clear error explanation
  const issues = fullCheck.error.issues.slice(0, 3).map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
  return {
    type: 'error',
    message: `Validation failed: ${issues}`,
  };
}

/**
 * Reads and validates an uploaded File object from browser file input.
 */
export async function parseAndValidateImportFile(file: File): Promise<RootState> {
  const text = await file.text();
  const res = parseImportFile(text, file.size);
  if (res.type === 'error') {
    throw new Error(res.message);
  }
  if (res.type === 'single_deck') {
    throw new Error('This file contains a single deck export. Please use full app backups for system restore, or import single decks from the Decks screen.');
  }
  return res.state;
}

/**
 * Merges imported state into current state (skipping existing IDs).
 */
export function mergeState(currentState: RootState, importedState: RootState): RootState {
  const existingDeckIds = new Set(currentState.decks.map((d) => d.id));
  const existingCardIds = new Set(currentState.cards.map((c) => c.id));
  const existingLogIds = new Set(currentState.reviewLog.map((l) => `${l.cardId}_${l.on}_${l.result}`));

  const newDecks = importedState.decks.filter((d) => !existingDeckIds.has(d.id));
  const newCards = importedState.cards.filter((c) => !existingCardIds.has(c.id));
  const newLogs = importedState.reviewLog.filter((l) => !existingLogIds.has(`${l.cardId}_${l.on}_${l.result}`));

  return {
    ...currentState,
    updatedAt: new Date().toISOString(),
    decks: [...currentState.decks, ...newDecks],
    cards: [...currentState.cards, ...newCards],
    reviewLog: [...currentState.reviewLog, ...newLogs].slice(-5000),
    streak: {
      current: Math.max(currentState.streak.current, importedState.streak.current),
      longest: Math.max(currentState.streak.longest, importedState.streak.longest),
      lastActiveOn: currentState.streak.lastActiveOn || importedState.streak.lastActiveOn,
    },
  };
}

/**
 * Imports a single deck into state, assigning brand new IDs to avoid conflicts.
 */
export function importSingleDeckIntoState(currentState: RootState, exportData: SingleDeckExport): RootState {
  const newDeckId = crypto.randomUUID();
  const now = new Date().toISOString();
  const today = getTodayDateString();

  const newDeck: Deck = {
    ...exportData.deck,
    id: newDeckId,
    name: `${exportData.deck.name} (Imported)`,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  const newCards: Card[] = exportData.cards.map((c) => ({
    ...c,
    id: crypto.randomUUID(),
    deckId: newDeckId,
    box: 1, // Start fresh for user
    lastReviewedOn: null,
    nextReviewOn: today,
    totalReviews: 0,
    totalCorrect: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }));

  return {
    ...currentState,
    updatedAt: now,
    decks: [...currentState.decks, newDeck],
    cards: [...currentState.cards, ...newCards],
  };
}
