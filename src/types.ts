import { z } from 'zod';

export type BoxNumber = 1 | 2 | 3 | 4 | 5;

export const BoxIntervalDays: Record<BoxNumber, number> = {
  1: 1,   // Daily
  2: 3,   // Every 3 days
  3: 7,   // Weekly
  4: 14,  // Bi-weekly
  5: 30,  // Monthly
};

export const CardSchema = z.object({
  id: z.string().min(1),
  deckId: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
  box: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  nextReviewDate: z.string(), // ISO String
  lastReviewedDate: z.string().nullable().optional(),
  streak: z.number().int().nonnegative().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Card = z.infer<typeof CardSchema>;

export const DeckSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  avatarEmoji: z.string().default('📚'),
  cardCount: z.number().int().nonnegative().default(0),
  dueCount: z.number().int().nonnegative().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Deck = z.infer<typeof DeckSchema>;

export type ThemeMode = 'system' | 'light' | 'dark';

export interface AppSettings {
  theme: ThemeMode;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export type ViewState = 'loading' | 'empty' | 'normal' | 'error';
