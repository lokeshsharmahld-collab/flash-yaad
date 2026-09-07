import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Layers } from 'lucide-react';
import { Deck, ViewState } from '../types';
import { storage } from '../lib/storage';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

export function DecksScreen() {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadDecks = async () => {
    setViewState('loading');
    setErrorMessage('');
    try {
      const storedDecks = await storage.getDecks();
      setDecks(storedDecks);
      setViewState(storedDecks.length === 0 ? 'empty' : 'normal');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load decks.';
      setErrorMessage(msg);
      setViewState('error');
    }
  };

  useEffect(() => {
    loadDecks();
  }, []);

  return (
    <div id="decks-screen" className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            My Decks
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
            Spaced repetition mastery using the 5-box Leitner system
          </p>
        </div>

        <button
          id="create-deck-button"
          type="button"
          onClick={() => {
            // Placeholder: Will be hooked up in P1.2 / P2.1
            alert('Deck creation will be configured in the next phase.');
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Deck</span>
        </button>
      </div>

      {/* 4 State Handling */}
      {viewState === 'loading' && (
        <LoadingState message="Loading your flashcard decks..." />
      )}

      {viewState === 'empty' && (
        <EmptyState
          id="decks-empty-state"
          icon={Layers}
          title="No Decks Yet"
          description="Create your first flashcard deck or import a starter set to begin learning with Leitner spaced repetition."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                id="empty-create-deck-button"
                type="button"
                onClick={() => {
                  alert('Deck creation will be configured in the next phase.');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Deck</span>
              </button>
            </div>
          }
        />
      )}

      {viewState === 'error' && (
        <ErrorState
          id="decks-error-state"
          title="Failed to Load Decks"
          message={errorMessage}
          onRetry={loadDecks}
        />
      )}

      {viewState === 'normal' && (
        <div id="decks-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <div
              key={deck.id}
              id={`deck-card-${deck.id}`}
              onClick={() => navigate(`/deck/${deck.id}`)}
              className="group cursor-pointer rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 hover:border-amber-400/50 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-2xl" role="img" aria-label={deck.title}>
                    {deck.avatarEmoji}
                  </span>
                  {deck.dueCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      <span>{deck.dueCount}</span> <span>due</span>
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {deck.title}
                </h3>
                {deck.description && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">
                    {deck.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{deck.cardCount} cards</span>
                </span>
                <span className="font-medium text-amber-600 dark:text-amber-400 group-hover:underline">
                  Open Deck &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
