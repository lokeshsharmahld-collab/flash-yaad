import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppState } from '../hooks/useAppState';
import { getDueCards } from '../lib/leitner';
import { exportSingleDeck } from '../lib/exportImport';
import { Card } from '../lib/schema';
import {
  ArrowLeft,
  Plus,
  Search,
  Download,
  Play,
  FileSpreadsheet,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export const DeckDetail: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { state, today, addCard, editCard, deleteCard, bulkAddCards } = useAppState();

  const deck = state.decks.find((d) => d.id === deckId && d.deletedAt === null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Single card form inputs
  const [frontInput, setFrontInput] = useState('');
  const [backInput, setBackInput] = useState('');

  // Bulk add textarea
  const [bulkText, setBulkText] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Get active cards for this deck
  const deckCards = useMemo(() => {
    return state.cards.filter((c) => c.deckId === deckId && c.deletedAt === null);
  }, [state.cards, deckId]);

  // Filtered cards by search query (case-insensitive on front + back)
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return deckCards;
    const q = searchQuery.toLowerCase();
    return deckCards.filter(
      (c) => c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q)
    );
  }, [deckCards, searchQuery]);

  const dueCards = useMemo(() => {
    return getDueCards(deckCards, today, state.settings.dailyNewCardLimit);
  }, [deckCards, today, state.settings.dailyNewCardLimit]);

  if (!deck) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Deck Not Found</h1>
        <p className="text-sm text-stone-500">
          This deck may have been deleted or moved to Trash.
        </p>
        <Link
          to="/decks"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Decks
        </Link>
      </div>
    );
  }

  // Single card validation
  const frontTrimmed = frontInput.trim();
  const backTrimmed = backInput.trim();
  const frontError =
    frontTrimmed.length === 0
      ? 'Question is required'
      : frontTrimmed.length > 500
      ? 'Question cannot exceed 500 characters'
      : null;

  const backError =
    backTrimmed.length === 0
      ? 'Answer is required'
      : backTrimmed.length > 2000
      ? 'Answer cannot exceed 2000 characters'
      : null;

  const isFormValid = !frontError && !backError;

  const handleOpenAddModal = () => {
    setEditingCard(null);
    setFrontInput('');
    setBackInput('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (card: Card) => {
    setEditingCard(card);
    setFrontInput(card.front);
    setBackInput(card.back);
    setShowAddModal(true);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !deckId) return;

    if (editingCard) {
      editCard(editingCard.id, frontTrimmed, backTrimmed);
    } else {
      addCard(deckId, frontTrimmed, backTrimmed);
    }

    setShowAddModal(false);
    setFrontInput('');
    setBackInput('');
    setEditingCard(null);
  };

  const handleDeleteCard = (cardId: string) => {
    if (confirm('Move this card to Trash? You can restore it later.')) {
      deleteCard(cardId);
    }
  };

  // Bulk add parsing: "Question :: Answer" per line
  const parsedBulkLines = useMemo(() => {
    if (!bulkText.trim()) return { valid: [], invalid: [] };
    const lines = bulkText.split('\n');
    const valid: Array<{ front: string; back: string; raw: string }> = [];
    const invalid: Array<{ raw: string; reason: string }> = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return; // ignore empty blank lines

      if (!trimmed.includes('::')) {
        invalid.push({ raw: trimmed, reason: 'Missing "::" separator' });
        return;
      }

      const parts = trimmed.split('::');
      const front = parts[0]?.trim();
      const back = parts.slice(1).join('::').trim();

      if (!front) {
        invalid.push({ raw: trimmed, reason: 'Front question is empty' });
      } else if (!back) {
        invalid.push({ raw: trimmed, reason: 'Back answer is empty' });
      } else if (front.length > 500) {
        invalid.push({ raw: trimmed, reason: 'Front exceeds 500 characters' });
      } else if (back.length > 2000) {
        invalid.push({ raw: trimmed, reason: 'Back exceeds 2000 characters' });
      } else {
        valid.push({ front, back, raw: trimmed });
      }
    });

    return { valid, invalid };
  }, [bulkText]);

  const handleExecuteBulkAdd = () => {
    if (parsedBulkLines.valid.length === 0 || !deckId) return;
    bulkAddCards(deckId, parsedBulkLines.valid);
    setBulkText('');
    setShowBulkModal(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top row navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/decks')}
            className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Back to decks"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{deck.emoji}</span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                {deck.name}
              </h1>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {deckCards.length} card{deckCards.length !== 1 ? 's' : ''} &middot; {dueCards.length} due today
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {dueCards.length > 0 && (
            <Link
              to={`/review?deckId=${deck.id}`}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 min-h-[40px]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Review ({dueCards.length})</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 min-h-[40px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Card</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 min-h-[40px]"
            title="Bulk Add with Question :: Answer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bulk Add</span>
          </button>

          <button
            type="button"
            onClick={() => exportSingleDeck(deck, state.cards)}
            className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Export this deck"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      {deckCards.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cards in this deck by question or answer..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Empty Deck State */}
      {deckCards.length === 0 ? (
        <div className="py-12 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 text-center p-8 space-y-4">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            📝
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">No cards yet</h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              Add your questions and answers one by one, or use Bulk Add mode to paste multiple cards.
            </p>
          </div>
          <div className="flex justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add First Card
            </button>
            <button
              type="button"
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Bulk Add
            </button>
          </div>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="py-12 text-center text-stone-500 dark:text-stone-400">
          No cards matched "{searchQuery}"
        </div>
      ) : (
        /* Cards List */
        <div className="space-y-3">
          {filteredCards.map((card, idx) => {
            const isDue = card.nextReviewOn <= today;

            return (
              <div
                key={card.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-stone-300 dark:hover:border-stone-700 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                      #{idx + 1}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                        card.box === 5
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : isDue
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      Box {card.box} {card.box === 5 ? '🏆 Mastered' : ''}
                    </span>
                    {isDue && (
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                        Due
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(card)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      title="Edit card"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                      title="Move card to trash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question */}
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-stone-400 block mb-1">
                    Question
                  </span>
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 whitespace-pre-wrap">
                    {card.front}
                  </p>
                </div>

                {/* Answer */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-stone-400 block mb-1">
                    Answer
                  </span>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
                    {card.back}
                  </p>
                </div>

                {/* Metadata footer */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-stone-400 font-mono">
                  <span>Reviews: {card.totalReviews} ({card.totalCorrect} correct)</span>
                  <span>Next review: {card.nextReviewOn}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="max-w-lg w-full bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              {editingCard ? 'Edit Flashcard' : 'Create New Flashcard'}
            </h2>

            <form onSubmit={handleSaveCard} className="space-y-4">
              {/* Question */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Question / Front *
                  </label>
                  <span className={`text-[11px] font-mono ${frontInput.length > 500 ? 'text-red-500 font-bold' : 'text-stone-400'}`}>
                    {frontInput.length} / 500
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter the concept, term, or question..."
                  value={frontInput}
                  onChange={(e) => setFrontInput(e.target.value)}
                  className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                {frontError && frontInput.length > 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {frontError}
                  </p>
                )}
              </div>

              {/* Answer */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Answer / Back *
                  </label>
                  <span className={`text-[11px] font-mono ${backInput.length > 2000 ? 'text-red-500 font-bold' : 'text-stone-400'}`}>
                    {backInput.length} / 2000
                  </span>
                </div>
                <textarea
                  rows={5}
                  required
                  placeholder="Enter the explanation, answer, or memory hooks..."
                  value={backInput}
                  onChange={(e) => setBackInput(e.target.value)}
                  className="w-full p-3 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                {backError && backInput.length > 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {backError}
                  </p>
                )}
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  {editingCard ? 'Save Changes' : 'Add Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="max-w-xl w-full bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Bulk Add Cards
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Paste one card per line using the <code className="bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded font-mono font-bold">::</code> separator between Question and Answer.
              </p>
            </div>

            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`What is Photosynthesis? :: Process by which green plants convert light energy into chemical glucose\nWhat is Ohm's Law? :: V = I * R`}
              className="w-full p-3 font-mono text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />

            {/* Validation counter */}
            <div className="flex items-center justify-between text-xs font-semibold p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {parsedBulkLines.valid.length} Valid Cards Ready
              </span>
              {parsedBulkLines.invalid.length > 0 && (
                <span className="text-red-500 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {parsedBulkLines.invalid.length} Skipped / Errors
                </span>
              )}
            </div>

            {/* Preview snippet */}
            {parsedBulkLines.valid.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] uppercase font-bold text-stone-400 block">
                  Preview (first 2):
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {parsedBulkLines.valid.slice(0, 2).map((item, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-stone-100 dark:bg-stone-800 rounded-lg text-xs"
                    >
                      <strong className="text-stone-900 dark:text-stone-100">Q: {item.front}</strong>
                      <p className="text-stone-600 dark:text-stone-300 truncate">A: {item.back}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={parsedBulkLines.valid.length === 0}
                onClick={handleExecuteBulkAdd}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                Import {parsedBulkLines.valid.length} Cards
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
