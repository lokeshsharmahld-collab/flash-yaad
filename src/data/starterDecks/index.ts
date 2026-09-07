import jsBasics from './jsBasics.json';
import dsaCheatsheet from './dsaCheatsheet.json';
import indianPolity from './indianPolity.json';
import generalScience from './generalScience.json';
import bankingEconomy from './bankingEconomy.json';
import { Deck, Card } from '../../lib/schema';
import { getTodayDateString } from '../../lib/leitner';

export interface StarterDeckDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cards: Array<{ front: string; back: string }>;
}

export const STARTER_DECKS: StarterDeckDefinition[] = [
  {
    id: 'js-basics',
    name: jsBasics.name,
    emoji: jsBasics.emoji,
    description: 'Closures, Event Loop, Scope, Promises, and Modern JS for Web Devs',
    cards: jsBasics.cards,
  },
  {
    id: 'dsa-cheatsheet',
    name: dsaCheatsheet.name,
    emoji: dsaCheatsheet.emoji,
    description: 'Time & Space complexities for Trees, Graphs, Sorting, DP & Algos',
    cards: dsaCheatsheet.cards,
  },
  {
    id: 'indian-polity',
    name: indianPolity.name,
    emoji: indianPolity.emoji,
    description: 'Fundamental Rights, DPSP, Writs, Emergency, and Constitutional Articles',
    cards: indianPolity.cards,
  },
  {
    id: 'general-science',
    name: generalScience.name,
    emoji: generalScience.emoji,
    description: 'Physics laws, Bio cell mechanisms, and Chem concepts for Competitive Exams',
    cards: generalScience.cards,
  },
  {
    id: 'banking-economy',
    name: bankingEconomy.name,
    emoji: bankingEconomy.emoji,
    description: 'RBI Repo rates, GDP/GNP, Monetary Policy, Inflation & Fiscal definitions',
    cards: bankingEconomy.cards,
  },
];

/**
 * Creates a brand-new instance of a starter deck with newly generated UUIDs.
 */
export function createStarterDeckInstance(starterId: string): { deck: Deck; cards: Card[] } | null {
  const starter = STARTER_DECKS.find((s) => s.id === starterId);
  if (!starter) return null;

  const deckId = crypto.randomUUID();
  const now = new Date().toISOString();
  const today = getTodayDateString();

  const deck: Deck = {
    id: deckId,
    name: starter.name,
    emoji: starter.emoji,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  const cards: Card[] = starter.cards.map((c) => ({
    id: crypto.randomUUID(),
    deckId,
    front: c.front,
    back: c.back,
    box: 1,
    lastReviewedOn: null,
    nextReviewOn: today, // default due today
    totalReviews: 0,
    totalCorrect: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }));

  return { deck, cards };
}
