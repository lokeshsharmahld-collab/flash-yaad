import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Plus, BookOpen, Layers } from 'lucide-react';
import { Deck, Card, ViewState } from '../types';
import { storage } from '../lib/storage';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

export function DeckDetailScreen() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  const [viewState, setViewState] = useState<ViewState>('loading');
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadDeckData = async () => {
    if (!deckId) {
      setErrorMessage('Deck ID parameter is missing.');
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
      const msg = err instanceof Error ? err.message : 'Error loading deck cards.';
      setErrorMessage(msg);
      setViewState('error');
    }
  };

  useEffect(() => {
    loadDeckData();
  }, [deckId]);

  return (
    <div id="deck-detail-screen" className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <button
        id="back-to-decks-button"
        type="button"
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Decks</span>
      </button>

      {/* Header with Title and Actions */}
      {deck && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl" role="img" aria-label={deck.title}>
              {deck.avatarEmoji}
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                {deck.title}
              </h1>
              {deck.description && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                  {deck.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="start-study-button"
              type="button"
              onClick={() => navigate(`/study/${deck.id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold text-sm transition-colors shadow-sm"
            >
              <Play className="w-4 h-4" />
              <span>Study Deck</span>
            </button>
            <button
              id="add-card-button"
              type="button"
              onClick={() => alert('Card management will be built in Phase 2.')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Card</span>
            </button>
          </div>
        </div>
      )}

      {/* 4 State Handling */}
      {viewState === 'loading' && (
        <LoadingState message="Loading deck cards..." />
      )}

      {viewState === 'empty' && (
        <EmptyState
          id="deck-cards-empty"
          icon={Layers}
          title="No Cards in This Deck"
          description="Start building your flashcard deck by creating your first card with front and back text."
          action={
            <button
              id="empty-add-card-button"
              type="button"
              onClick={() => alert('Card management will be built in Phase 2.')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Card</span>
            </button>
          }
        />
      )}

      {viewState === 'error' && (
        <ErrorState
          id="deck-detail-error"
          title="Failed to Load Deck"
          message={errorMessage}
          onRetry={loadDeckData}
        />
      )}

      {viewState === 'normal' && (
        <div id="deck-cards-list" className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2 px-1">
            <span>Cards ({cards.length})</span>
            <span>Box Level</span>
          </div>
          {cards.map((card) => (
            <div
              key={card.id}
              id={`card-item-${card.id}`}
              className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex items-center justify-between gap-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {card.front}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                  {card.back}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                  <span>Box {card.box}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
