import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, RotateCw } from 'lucide-react';
import { Deck, Card, ViewState } from '../types';
import { storage } from '../lib/storage';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

export function StudyScreen() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [viewState, setViewState] = useState<ViewState>('loading');
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadStudySession = async () => {
    if (!deckId) {
      setErrorMessage('No deck ID specified.');
      setViewState('error');
      return;
    }

    setViewState('loading');
    setErrorMessage('');
    try {
      const allDecks = await storage.getDecks();
      const currentDeck = allDecks.find((d) => d.id === deckId);
      if (!currentDeck) {
        setErrorMessage('Deck not found.');
        setViewState('error');
        return;
      }

      setDeck(currentDeck);
      const deckCards = await storage.getCardsForDeck(deckId);
      setCards(deckCards);
      setViewState(deckCards.length === 0 ? 'empty' : 'normal');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error starting study session.';
      setErrorMessage(msg);
      setViewState('error');
    }
  };

  useEffect(() => {
    loadStudySession();
  }, [deckId]);

  return (
    <div id="study-screen" className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <button
        id="study-back-button"
        type="button"
        onClick={() => navigate(deckId ? `/deck/${deckId}` : '/')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Exit Session</span>
      </button>

      {/* 4 State Handling */}
      {viewState === 'loading' && (
        <LoadingState message="Preparing your Leitner study session..." />
      )}

      {viewState === 'empty' && (
        <EmptyState
          id="study-cards-empty"
          icon={BookOpen}
          title="No Cards Due For Study"
          description="All cards in this deck are reviewed or no cards have been added yet."
          action={
            <button
              id="study-empty-back-button"
              type="button"
              onClick={() => navigate(deckId ? `/deck/${deckId}` : '/')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold"
            >
              <span>Back to Deck</span>
            </button>
          }
        />
      )}

      {viewState === 'error' && (
        <ErrorState
          id="study-session-error"
          title="Study Session Error"
          message={errorMessage}
          onRetry={loadStudySession}
        />
      )}

      {viewState === 'normal' && deck && (
        <div id="study-container" className="flex flex-col items-center">
          {/* Header indicator */}
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              {deck.title} • Leitner Session
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              Card 1 of {cards.length}
            </span>
          </div>

          {/* Flashcard Frame (Placeholder for Phase 3) */}
          <div
            id="study-flashcard-preview"
            className="w-full aspect-[4/3] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 flex flex-col items-center justify-center text-center shadow-sm"
          >
            <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold mb-4">
              Front (Prompt)
            </span>
            <p className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-neutral-100 max-w-md">
              {cards[0]?.front || 'Study Session Module Placeholder'}
            </p>
            <div className="mt-8 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Click card or press space to flip (Configured in Phase 3)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
