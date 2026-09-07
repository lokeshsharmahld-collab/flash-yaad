import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { getDueCards } from '../lib/leitner';
import { exportSingleDeck } from '../lib/exportImport';
import { Plus, Layers, Play, MoreVertical, Edit2, Trash2, Download, BookOpen } from 'lucide-react';

export const Decks: React.FC = () => {
  const { state, isLoading, today, addDeck, renameDeck, deleteDeck } = useAppState();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [deckNameInput, setDeckNameInput] = useState('');
  const [deckEmojiInput, setDeckEmojiInput] = useState('📚');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-stone-200 dark:bg-stone-800 rounded-xl w-48"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-36 bg-stone-200 dark:bg-stone-800 rounded-2xl"></div>
          <div className="h-36 bg-stone-200 dark:bg-stone-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const activeDecks = state.decks.filter((d) => d.deletedAt === null);
  const activeCards = state.cards.filter((c) => c.deletedAt === null);

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckNameInput.trim()) return;

    if (editingDeckId) {
      renameDeck(editingDeckId, deckNameInput.trim(), deckEmojiInput || '📚');
      setEditingDeckId(null);
    } else {
      addDeck(deckNameInput.trim(), deckEmojiInput || '📚');
      setShowCreateModal(false);
    }
    setDeckNameInput('');
    setDeckEmojiInput('📚');
  };

  const openEditModal = (deckId: string, currentName: string, currentEmoji: string) => {
    setEditingDeckId(deckId);
    setDeckNameInput(currentName);
    setDeckEmojiInput(currentEmoji);
    setMenuOpenId(null);
  };

  const handleDelete = (deckId: string, deckName: string) => {
    setMenuOpenId(null);
    if (confirm(`Move deck "${deckName}" and all its cards to Trash? You can restore it within 30 days.`)) {
      deleteDeck(deckId);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Decks & Collections
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {activeDecks.length} deck{activeDecks.length !== 1 ? 's' : ''} total
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setDeckNameInput('');
            setDeckEmojiInput('📚');
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Deck</span>
        </button>
      </div>

      {/* Empty state */}
      {activeDecks.length === 0 ? (
        <div className="py-12 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 text-center p-8 space-y-4">
          <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 text-stone-500 rounded-2xl flex items-center justify-center mx-auto text-3xl">
            📚
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">No active decks</h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              Create your first deck to start adding flashcards, or restore deleted decks from Trash.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Deck
          </button>
        </div>
      ) : (
        /* Deck Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activeDecks.map((deck) => {
            const deckCards = activeCards.filter((c) => c.deckId === deck.id);
            const deckDue = getDueCards(deckCards, today, state.settings.dailyNewCardLimit);
            const deckMastered = deckCards.filter((c) => c.box === 5);

            return (
              <div
                key={deck.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between relative group"
              >
                <div>
                  {/* Top line: Emoji + Name + Menu */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <Link
                      to={`/decks/${deck.id}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <span className="text-3xl p-1.5 bg-stone-50 dark:bg-stone-800 rounded-xl shrink-0">
                        {deck.emoji}
                      </span>
                      <div className="min-w-0">
                        <h2 className="font-bold text-stone-900 dark:text-stone-100 text-base truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          {deck.name}
                        </h2>
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          {deckCards.length} card{deckCards.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </Link>

                    {/* Context menu toggle */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMenuOpenId(menuOpenId === deck.id ? null : deck.id)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Deck actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {menuOpenId === deck.id && (
                        <div className="absolute right-0 top-11 z-20 w-44 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl py-1 text-xs">
                          <button
                            type="button"
                            onClick={() => openEditModal(deck.id, deck.name, deck.emoji)}
                            className="w-full px-3.5 py-2.5 text-left text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                            Rename Deck
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              exportSingleDeck(deck, state.cards);
                              setMenuOpenId(null);
                            }}
                            className="w-full px-3.5 py-2.5 text-left text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-2"
                          >
                            <Download className="w-3.5 h-3.5 text-stone-500" />
                            Export Single Deck
                          </button>
                          <div className="border-t border-stone-100 dark:border-stone-700 my-1" />
                          <button
                            type="button"
                            onClick={() => handleDelete(deck.id, deck.name)}
                            className="w-full px-3.5 py-2.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Move to Trash
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badges / stats */}
                  <div className="flex items-center gap-2 text-xs py-2 text-stone-600 dark:text-stone-400">
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 font-medium">
                      🏆 {deckMastered.length} Mastered
                    </span>
                    {deckDue.length > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
                        {deckDue.length} Due Today
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom actions */}
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-stone-100 dark:border-stone-800/80 gap-2">
                  <Link
                    to={`/decks/${deck.id}`}
                    className="text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-2 px-1 flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Manage Cards
                  </Link>

                  {deckDue.length > 0 ? (
                    <Link
                      to={`/review?deckId=${deck.id}`}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs min-h-[36px]"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Review ({deckDue.length})
                    </Link>
                  ) : (
                    <span className="text-xs text-stone-400 py-1.5">No reviews due</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Create/Rename */}
      {(showCreateModal || editingDeckId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              {editingDeckId ? 'Rename Deck' : 'Create New Deck'}
            </h2>
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Deck Emoji
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={deckEmojiInput}
                  onChange={(e) => setDeckEmojiInput(e.target.value)}
                  className="w-16 text-center text-2xl p-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Deck Name (1–60 chars)
                </label>
                <input
                  type="text"
                  required
                  maxLength={60}
                  placeholder="e.g. UPSC Modern History..."
                  value={deckNameInput}
                  onChange={(e) => setDeckNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingDeckId(null);
                  }}
                  className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!deckNameInput.trim()}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  {editingDeckId ? 'Save Changes' : 'Create Deck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
