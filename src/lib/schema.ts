import { z } from 'zod';

export const CURRENT_SCHEMA_VERSION = 1;

export const SettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  dailyNewCardLimit: z.number().int().min(5).max(200).default(20),
  lastBackupAt: z.string().nullable().default(null),
  cardsAddedSinceBackup: z.number().int().min(0).default(0),
});

export const DeckSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(60),
  emoji: z.string().default('📚'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().default(null),
});

export const CardSchema = z.object({
  id: z.string().uuid(),
  deckId: z.string().uuid(),
  front: z.string().trim().min(1).max(500),
  back: z.string().trim().min(1).max(2000),
  box: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).default(1),
  lastReviewedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  nextReviewOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalReviews: z.number().int().min(0).default(0),
  totalCorrect: z.number().int().min(0).default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().default(null),
});

export const ReviewEventSchema = z.object({
  cardId: z.string().uuid(),
  on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  result: z.enum(['correct', 'wrong']),
  fromBox: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  toBox: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
});

export const StreakStateSchema = z.object({
  current: z.number().int().min(0).default(0),
  longest: z.number().int().min(0).default(0),
  lastActiveOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
});

export const TrashStateSchema = z.object({
  decks: z.array(DeckSchema).default([]),
  cards: z.array(CardSchema).default([]),
});

export const RootStateSchema = z.object({
  schemaVersion: z.number().int().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  settings: SettingsSchema,
  decks: z.array(DeckSchema),
  cards: z.array(CardSchema),
  reviewLog: z.array(ReviewEventSchema).max(5000),
  streak: StreakStateSchema,
  trash: TrashStateSchema,
});

export type Settings = z.infer<typeof SettingsSchema>;
export type Deck = z.infer<typeof DeckSchema>;
export type Card = z.infer<typeof CardSchema>;
export type ReviewEvent = z.infer<typeof ReviewEventSchema>;
export type StreakState = z.infer<typeof StreakStateSchema>;
export type TrashState = z.infer<typeof TrashStateSchema>;
export type RootState = z.infer<typeof RootStateSchema>;

export function createInitialState(): RootState {
  const now = new Date().toISOString();
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    settings: {
      theme: 'system',
      dailyNewCardLimit: 20,
      lastBackupAt: null,
      cardsAddedSinceBackup: 0,
    },
    decks: [],
    cards: [],
    reviewLog: [],
    streak: {
      current: 0,
      longest: 0,
      lastActiveOn: null,
    },
    trash: {
      decks: [],
      cards: [],
    },
  };
}

export function migrate(rawState: unknown): RootState {
  if (!rawState || typeof rawState !== 'object') {
    throw new Error('State is not a valid object');
  }

  const obj = rawState as Record<string, unknown>;
  const version = typeof obj.schemaVersion === 'number' ? obj.schemaVersion : 0;

  if (version === 0) {
    throw new Error('Unversioned state data cannot be migrated safely');
  }

  if (version > CURRENT_SCHEMA_VERSION) {
    throw new Error(`State version (${version}) is newer than current app version (${CURRENT_SCHEMA_VERSION})`);
  }

  // Future migrations can be chained sequentially here:
  // if (version < 2) { obj = migrateV1ToV2(obj); }

  const parseResult = RootStateSchema.safeParse(obj);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`Validation failed: ${errorDetails}`);
  }

  return parseResult.data;
}
