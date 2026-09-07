import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export const Trash: React.FC = () => {
  const { state, restoreDeck, restoreCard, permanentlyDeleteDeck, permanentlyDeleteCard, emptyTrash } = useAppState();
  const [showConfirmEmpty, setShowConfirmEmpty] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const trashedDecks = state.trash.decks;
  const trashedCards = state.trash.cards;
  const totalCount = trashedDecks.length + trashedCards.length;

  const getDaysAgo = (deletedAt: string | null) => {
    if (!deletedAt) return 0;
    try {
      return differenceInDays(new Date(), parseISO(deletedAt));
    } catch {
      return 0;
    }
  };

  const handleEmptyAll = () => {
    if (confirmInput.trim().toUpperCase() === 'DELETE') {
      emptyTrash();
      setShowConfirmEmpty(false);
      setConfirmInput('');
    }
  };

  if (totalCount === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 text-stone-400 rounded-3xl flex items-center justify-center mx-auto text-3xl">
          🗑️
        </div>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          Trash is empty
        </h1>
        <p className="text-sm text-stone-500 max-w-sm mx-auto">
          Deleted flashcards and decks remain here for 30 days before being automatically purged.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Trash ({totalCount})
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Items are retained for 30 days. You can restore them anytime or delete them permanently.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowConfirmEmpty(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 font-semibold text-xs rounded-xl transition-colors min-h-[40px]"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Empty Trash</span>
        </button>
      </div>

      {/* Trashed Decks */}
      {trashedDecks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
            Decks in Trash ({trashedDecks.length})
          </h2>
          <div className="space-y-2">
            {trashedDecks.map((deck) => {
              const daysAgo = getDaysAgo(deck.deletedAt);
              const daysRemaining = Math.max(0, 30 - daysAgo);

              return (
                <div
                  key={deck.id}
                  className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{deck.emoji}</span>
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {deck.name}
                      </h3>
                      <p className="text-xs text-stone-400">
                        Deleted {daysAgo === 0 ? 'today' : `${daysAgo}d ago`} &middot; auto-purged in {daysRemaining}d
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => restoreDeck(deck.id)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold flex items-center gap-1 min-h-[36px]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Permanently delete deck "${deck.name}" and its cards? This cannot be undone.`)) {
                          permanentlyDeleteDeck(deck.id);
                        }
                      }}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trashed Individual Cards */}
      {trashedCards.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
            Cards in Trash ({trashedCards.length})
          </h2>
          <div className="space-y-2">
            {trashedCards.map((card) => {
              const daysAgo = getDaysAgo(card.deletedAt);
              const daysRemaining = Math.max(0, 30 - daysAgo);

              return (
                <div
                  key={card.id}
                  className="p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate">
                      {card.front}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                      {card.back}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Deleted {daysAgo === 0 ? 'today' : `${daysAgo}d ago`} &middot; auto-purged in {daysRemaining}d
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => restoreCard(card.id)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold flex items-center gap-1 min-h-[36px]"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => permanentlyDeleteCard(card.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal to Empty Trash */}
      {showConfirmEmpty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Permanently Empty Trash?
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                This will permanently erase all {totalCount} trashed items. This action cannot be undone. Type <strong className="text-red-600">DELETE</strong> to confirm.
              </p>
            </div>

            <input
              type="text"
              placeholder="Type DELETE"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="w-full text-center tracking-widest font-mono uppercase p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500"
              autoFocus
            />

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmEmpty(false);
                  setConfirmInput('');
                }}
                className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmInput.trim().toUpperCase() !== 'DELETE'}
                onClick={handleEmptyAll}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                Permanently Erase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
