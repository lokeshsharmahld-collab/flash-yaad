import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  RootState,
  createInitialState,
  Deck,
  Card,
  Settings,
  ReviewEvent,
} from '../lib/schema';
import {
  initStorage,
  saveStateDebounced,
  clearStorage,
  getStorageStatus,
  subscribeStorageStatus,
  StorageMode,
} from '../lib/storage';
import {
  getTodayDateString,
  applyReview,
  addDaysToDateString,
} from '../lib/leitner';
import { updateStreak } from '../lib/streak';
import { createStarterDeckInstance } from '../data/starterDecks';
import { mergeState } from '../lib/exportImport';

interface AppContextType {
  state: RootState;
  isLoading: boolean;
  today: string;
  storageStatus: {
    mode: StorageMode;
    isPersisted: boolean;
    quotaExceeded: boolean;
    isSafariWarningNeeded: boolean;
  };
  dismissSafariWarning: () => void;
  // Decks
  addDeck: (name: string, emoji?: string) => Deck;
  renameDeck: (deckId: string, name: string, emoji?: string) => void;
  deleteDeck: (deckId: string) => void;
  restoreDeck: (deckId: string) => void;
  // Cards
  addCard: (deckId: string, front: string, back: string) => Card;
  editCard: (cardId: string, front: string, back: string) => void;
  deleteCard: (cardId: string) => void;
  restoreCard: (cardId: string) => void;
  bulkAddCards: (deckId: string, pairs: Array<{ front: string; back: string }>) => number;
  // Reviews
  recordReview: (cardId: string, result: 'correct' | 'wrong') => { updatedCard: Card; mastered: boolean };
  undoReview: (previousCard: Card, lastReviewEvent?: ReviewEvent) => void;
  // Starters & Portability
  loadStarterDeck: (starterId: string) => { deck: Deck; cardsCount: number } | null;
  replaceState: (newState: RootState) => void;
  mergeImportedState: (importedState: RootState) => void;
  clearAllData: () => Promise<void>;
  // Trash
  purgeTrash: () => void;
  emptyTrash: () => void;
  permanentlyDeleteDeck: (deckId: string) => void;
  permanentlyDeleteCard: (cardId: string) => void;
  // Settings & Backups
  updateSettings: (partial: Partial<Settings>) => void;
  recordBackupDownloaded: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<RootState>(createInitialState());
  const [isLoading, setIsLoading] = useState(true);
  const [today, setToday] = useState(getTodayDateString());
  const [storageStatus, setStorageStatus] = useState(getStorageStatus());
  const [safariTipDismissed, setSafariTipDismissed] = useState(false);

  // Sync state ref to avoid stale closures in callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  const persistState = useCallback((newState: RootState) => {
    setState(newState);
    saveStateDebounced(newState);
  }, []);

  // Check today date and purge expired trash (>30 days old)
  const refreshTodayAndPurgeTrash = useCallback((currentState: RootState): RootState => {
    const currentToday = getTodayDateString();
    setToday(currentToday);

    const thirtyDaysAgo = addDaysToDateString(currentToday, -30);

    const activeDecksInTrash = currentState.trash.decks.filter(
      (d) => d.deletedAt && d.deletedAt.slice(0, 10) >= thirtyDaysAgo
    );
    const activeCardsInTrash = currentState.trash.cards.filter(
      (c) => c.deletedAt && c.deletedAt.slice(0, 10) >= thirtyDaysAgo
    );

    if (
      activeDecksInTrash.length !== currentState.trash.decks.length ||
      activeCardsInTrash.length !== currentState.trash.cards.length
    ) {
      return {
        ...currentState,
        trash: {
          decks: activeDecksInTrash,
          cards: activeCardsInTrash,
        },
      };
    }
    return currentState;
  }, []);

  // Initialize storage on mount
  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const { state: loadedState } = await initStorage();
        if (mounted) {
          const cleaned = refreshTodayAndPurgeTrash(loadedState);
          setState(cleaned);
          setIsLoading(false);
          setStorageStatus(getStorageStatus());
        }
      } catch (err) {
        console.error('Storage initialization failure:', err);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();

    const unsub = subscribeStorageStatus(() => {
      if (mounted) {
        setStorageStatus(getStorageStatus());
      }
    });

    // Recompute date and check midnight rollover on visibilitychange
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentToday = getTodayDateString();
        setToday(currentToday);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      unsub();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshTodayAndPurgeTrash]);

  // Theme application
  useEffect(() => {
    const theme = state.settings.theme;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [state.settings.theme]);

  // Deck operations
  const addDeck = useCallback((name: string, emoji = '📚'): Deck => {
    const now = new Date().toISOString();
    const newDeck: Deck = {
      id: crypto.randomUUID(),
      name: name.trim(),
      emoji: emoji || '📚',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    const newState: RootState = {
      ...stateRef.current,
      updatedAt: now,
      decks: [...stateRef.current.decks, newDeck],
    };
    persistState(newState);
    return newDeck;
  }, [persistState]);

  const renameDeck = useCallback((deckId: string, name: string, emoji?: string) => {
    const now = new Date().toISOString();
    const newState: RootState = {
      ...stateRef.current,
      updatedAt: now,
      decks: stateRef.current.decks.map((d) =>
        d.id === deckId ? { ...d, name: name.trim(), emoji: emoji || d.emoji, updatedAt: now } : d
      ),
    };
    persistState(newState);
  }, [persistState]);

  const deleteDeck = useCallback((deckId: string) => {
    const now = new Date().toISOString();
    const deckToDelete = stateRef.current.decks.find((d) => d.id === deckId);
    if (!deckToDelete) return;

    const softDeletedDeck: Deck = { ...deckToDelete, deletedAt: now, updatedAt: now };
    const remainingDecks = stateRef.current.decks.filter((d) => d.id !== deckId);

    // Soft delete its cards
    const deckCardsToTrash: Card[] = [];
    const remainingCards: Card[] = [];

    for (const card of stateRef.current.cards) {
      if (card.deckId === deckId && card.deletedAt === null) {
        deckCardsToTrash.push({ ...card, deletedAt: now, updatedAt: now });
      } else {
        remainingCards.push(card);
      }
    }

    const newState: RootState = {
      ...stateRef.current,
      updatedAt: now,
      decks: remainingDecks,
      cards: remainingCards,
      trash: {
        decks: [...stateRef.current.trash.decks, softDeletedDeck],
        cards: [...stateRef.current.trash.cards, ...deckCardsToTrash],
      },
    };
    persistState(newState);
  }, [persistState]);

  const restoreDeck = useCallback((deckId: string) => {
    const now = new Date().toISOString();
    const deckToRestore = stateRef.current.trash.decks.find((d) => d.id === deckId);
    if (!deckToRestore) return;

    const restoredDeck: Deck = { ...deckToRestore, deletedAt: null, updatedAt: now };
    const remainingTrashDecks = stateRef.current.trash.decks.filter((d) => d.id !== deckId);

    // Restore its associated cards in trash
    const restoredCards: Card[] = [];
    const remainingTrashCards: Card[] = [];

    for (const card of stateRef.current.trash.cards) {
      if (card.deckId === deckId) {
        restoredCards.push({ ...card, deletedAt: null, updatedAt: now });
      } else {
        remainingTrashCards.push(card);
      }
    }

    const newState: RootState = {
      ...stateRef.current,
      updatedAt: now,
      decks: [...stateRef.current.decks, restoredDeck],
      cards: [...stateRef.current.cards, ...restoredCards],
      trash: {
        decks: remainingTrashDecks,
        cards: remainingTrashCards,
      },
    };
    persistState(newState);
  }, [persistState]);

  // Card operations
  const addCard = useCallback((deckId: string, front: string, back: string): Card => {
    const now = new Date().toISOString();
    const currentToday = getTodayDateString();
    const newCard: Card = {
      id: crypto.randomUUID(),
      deckId,
      front: front.trim(),
      back: back.trim(),
      box: 1,
      lastReviewedOn: null,
      nextReviewOn: currentToday,
      totalReviews: 0,
      totalCorrect: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const newState: RootState = {
      ...stateRef.current,
      updatedAt: now,
      cards: [...stateRef.current.cards, newCard],
      settings: {
        ...stateRef.current.settings,
        cardsAddedSinceBackup: stateRef.current.settings.cardsAddedSinceBackup + 1,
      },
    };
    persistState(newState);
    return newCard;
  }, [persistState]);

  const editCard = useCallback((cardId: string, front: string, back: string) => {
    const now = new Date().toISOString();
    const newState: RootState = {
      ...stateRef.current,
      updatedAt: now,
      cards: stateRef.current.cards.map((c) =>
        c.id === cardId ? { ...c, front: front.trim(), back: back.trim(), updatedAt: now } : c
      ),
    };
    persistState(newState);
  }, [persistState]);

  const deleteCard = useCallback((cardId: string) => {
    const now = new Date().toISOString();
    const cardToDelete = stateRef.current.cards.find((c) => c.id === cardId);
    if (!cardToDelete) return;

    const softDeletedCard: Card = { ...cardToDelete, deletedAt: now, updatedAt: now };
    const remainingCards = stateRef.current.cards.filter((c) => c.id !== cardId);

    const newState: RootState = {
      ...stateRef.current,
      updatedAt: now,
      cards: remainingCards,
      trash: {
        ...stateRef.current.trash,
        cards: [...stateRef.current.trash.cards, softDeletedCard],
      },
    };
    persistState(newState);
  }, [persistState]);

  const restoreCard = useCallback((cardId: string) => {
    const now = new Date().toISOString();
    const cardToRestore = stateRef.current.trash.cards.find((c) => c.id === cardId);
    if (!cardToRestore) return;

    const restoredCard: Card = { ...cardToRestore, deletedAt: null, updatedAt: now };
    const remainingTrashCards = stateRef.current.trash.cards.filter((c) => c.id !== cardId);

    const newState: RootState = {
      ...stateRef.current,
      updatedAt: now,
      cards: [...stateRef.current.cards, restoredCard],
      trash: {
        ...stateRef.current.trash,
        cards: remainingTrashCards,
      },
    };
    persistState(newState);
  }, [persistState]);

  const bulkAddCards = useCallback((deckId: string, pairs: Array<{ front: string; back: string }>): number => {
    if (pairs.length === 0) return 0;
    const now = new Date().toISOString();
    const currentToday = getTodayDateString();

    const newCards: Card[] = pairs.map((p) => ({
      id: crypto.randomUUID(),
      deckId,
      front: p.front.trim(),
      back: p.back.trim(),
      box: 1,
      lastReviewedOn: null,
      nextReviewOn: currentToday,
      totalReviews: 0,
      totalCorrect: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }));

    const newState: RootState = {
      ...stateRef.current,
      updatedAt: now,
      cards: [...stateRef.current.cards, ...newCards],
      settings: {
        ...stateRef.current.settings,
        cardsAddedSinceBackup: stateRef.current.settings.cardsAddedSinceBackup + newCards.length,
      },
    };
    persistState(newState);
    return newCards.length;
  }, [persistState]);

  // Review operations
  const recordReview = useCallback((cardId: string, result: 'correct' | 'wrong') => {
    const currentToday = getTodayDateString();
    const now = new Date().toISOString();
    const card = stateRef.current.cards.find((c) => c.id === cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    const previousBox = card.box;
    const updatedCard = applyReview(card, result, currentToday);
    const updatedStreak = updateStreak(stateRef.current.streak, currentToday);

    const reviewEvent: ReviewEvent = {
      cardId,
      on: currentToday,
      result,
      fromBox: previousBox,
      toBox: updatedCard.box,
    };

    const newReviewLog = [...stateRef.current.reviewLog, reviewEvent].slice(-5000);

    const newState: RootState = {
      ...stateRef.current,
      updatedAt: now,
      cards: stateRef.current.cards.map((c) => (c.id === cardId ? updatedCard : c)),
      reviewLog: newReviewLog,
      streak: updatedStreak,
    };

    persistState(newState);
    const mastered = updatedCard.box === 5;
    return { updatedCard, mastered };
  }, [persistState]);

  const undoReview = useCallback((previousCard: Card, lastReviewEvent?: ReviewEvent) => {
    const now = new Date().toISOString();
    let newLog = stateRef.current.reviewLog;
    if (lastReviewEvent) {
      newLog = newLog.slice(0, -1);
    }

    const newState: RootState = {
      ...stateRef.current,
      updatedAt: now,
      cards: stateRef.current.cards.map((c) => (c.id === previousCard.id ? previousCard : c)),
      reviewLog: newLog,
    };
    persistState(newState);
  }, [persistState]);

  // Starter deck loading
  const loadStarterDeck = useCallback((starterId: string) => {
    const instance = createStarterDeckInstance(starterId);
    if (!instance) return null;

    const now = new Date().toISOString();
    const newState: RootState = {
      ...stateRef.current,
      updatedAt: now,
      decks: [...stateRef.current.decks, instance.deck],
      cards: [...stateRef.current.cards, ...instance.cards],
      settings: {
        ...stateRef.current.settings,
        cardsAddedSinceBackup: stateRef.current.settings.cardsAddedSinceBackup + instance.cards.length,
      },
    };
    persistState(newState);
    return { deck: instance.deck, cardsCount: instance.cards.length };
  }, [persistState]);

  // State replace & merge
  const replaceState = useCallback((newState: RootState) => {
    persistState(newState);
  }, [persistState]);

  const mergeImportedState = useCallback((importedState: RootState) => {
    const merged = mergeState(stateRef.current, importedState);
    persistState(merged);
  }, [persistState]);

  const clearAllData = useCallback(async () => {
    await clearStorage();
    setState(createInitialState());
  }, []);

  const purgeTrash = useCallback(() => {
    const now = new Date().toISOString();
    const newState: RootState = {
      ...stateRef.current,
      updatedAt: now,
      trash: {
        decks: [],
        cards: [],
      },
    };
    persistState(newState);
  }, [persistState]);

  const emptyTrash = purgeTrash;

  const permanentlyDeleteDeck = useCallback((deckId: string) => {
    const now = new Date().toISOString();
    const newState: RootState = {
      ...stateRef.current,
      updatedAt: now,
      trash: {
        decks: stateRef.current.trash.decks.filter((d) => d.id !== deckId),
        cards: stateRef.current.trash.cards.filter((c) => c.deckId !== deckId),
      },
    };
    persistState(newState);
  }, [persistState]);

  const permanentlyDeleteCard = useCallback((cardId: string) => {
    const now = new Date().toISOString();
    const newState: RootState = {
      ...stateRef.current,
      updatedAt: now,
      trash: {
        ...stateRef.current.trash,
        cards: stateRef.current.trash.cards.filter((c) => c.id !== cardId),
      },
    };
    persistState(newState);
  }, [persistState]);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    const now = new Date().toISOString();
    const newState: RootState = {
      ...stateRef.current,
      updatedAt: now,
      settings: {
        ...stateRef.current.settings,
        ...partial,
      },
    };
    persistState(newState);
  }, [persistState]);

  const recordBackupDownloaded = useCallback(() => {
    const now = new Date().toISOString();
    const newState: RootState = {
      ...stateRef.current,
      updatedAt: now,
      settings: {
        ...stateRef.current.settings,
        lastBackupAt: now,
        cardsAddedSinceBackup: 0,
      },
    };
    persistState(newState);
  }, [persistState]);

  const dismissSafariWarning = useCallback(() => {
    setSafariTipDismissed(true);
  }, []);

  const value: AppContextType = {
    state,
    isLoading,
    today,
    storageStatus: {
      ...storageStatus,
      isSafariWarningNeeded: storageStatus.isSafariWarningNeeded && !safariTipDismissed,
    },
    dismissSafariWarning,
    addDeck,
    renameDeck,
    deleteDeck,
    restoreDeck,
    addCard,
    editCard,
    deleteCard,
    restoreCard,
    bulkAddCards,
    recordReview,
    undoReview,
    loadStarterDeck,
    replaceState,
    mergeImportedState,
    clearAllData,
    purgeTrash,
    emptyTrash,
    permanentlyDeleteDeck,
    permanentlyDeleteCard,
    updateSettings,
    recordBackupDownloaded,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const AppStateProvider = AppProvider;

export function useAppState(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}
