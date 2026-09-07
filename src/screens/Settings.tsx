import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState';
import { exportFullData, parseAndValidateImportFile } from '../lib/exportImport';
import {
  Download,
  Upload,
  Printer,
  Moon,
  Sun,
  Laptop,
  Trash2,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { RootState } from '../lib/schema';

export const Settings: React.FC = () => {
  const {
    state,
    storageStatus,
    updateSettings,
    replaceState,
    mergeImportedState,
    recordBackupDownloaded,
    clearAllData,
  } = useAppState();

  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [pendingImportData, setPendingImportData] = useState<RootState | null>(null);
  const [showImportModeModal, setShowImportModeModal] = useState(false);

  const [printDeckId, setPrintDeckId] = useState<string>('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  const [storageEstimate, setStorageEstimate] = useState<{ usedMb: string; quotaMb: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((estimate) => {
        if (estimate.usage !== undefined && estimate.quota !== undefined) {
          setStorageEstimate({
            usedMb: (estimate.usage / (1024 * 1024)).toFixed(2),
            quotaMb: (estimate.quota / (1024 * 1024)).toFixed(0),
          });
        }
      });
    }
  }, []);

  const handleExport = () => {
    exportFullData(state);
    recordBackupDownloaded();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseAndValidateImportFile(file);
      setPendingImportData(parsed);
      setShowImportModeModal(true);
    } catch (err: any) {
      setImportError(err.message || 'Invalid backup file format');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleApplyImport = (mode: 'merge' | 'replace') => {
    if (!pendingImportData) return;
    try {
      if (mode === 'merge') {
        mergeImportedState(pendingImportData);
      } else {
        replaceState(pendingImportData);
      }
      setShowImportModeModal(false);
      setPendingImportData(null);
      setImportSuccess(`Successfully imported in "${mode}" mode!`);
    } catch (err: any) {
      setImportError(err.message || 'Failed to apply imported data');
    }
  };

  const handlePrintDeck = () => {
    if (!printDeckId) return;
    window.print();
  };

  const handleExecuteReset = () => {
    if (resetConfirmText.trim().toUpperCase() === 'RESET') {
      clearAllData();
      setShowResetModal(false);
      setResetConfirmText('');
    }
  };

  const activeDecks = state.decks.filter((d) => d.deletedAt === null);
  const selectedDeckForPrint = activeDecks.find((d) => d.id === printDeckId);
  const printCards = selectedDeckForPrint
    ? state.cards.filter((c) => c.deckId === selectedDeckForPrint.id && c.deletedAt === null)
    : [];

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Settings & Data Management
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Manage local device storage, spaced repetition cadence, and exports.
        </p>
      </div>

      {/* Storage Engine Status */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-indigo-500" />
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Offline Storage Status
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
            <span className="text-stone-400 uppercase font-semibold text-[10px] block">Storage Mode</span>
            <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-sm capitalize">
              {storageStatus.mode}
            </span>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
            <span className="text-stone-400 uppercase font-semibold text-[10px] block">Quota Usage</span>
            <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-sm">
              {storageEstimate ? `${storageEstimate.usedMb} MB / ${storageEstimate.quotaMb} MB` : 'Available'}
            </span>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
            <span className="text-stone-400 uppercase font-semibold text-[10px] block">Cards Added Since Backup</span>
            <span className="font-mono font-bold text-stone-900 dark:text-stone-100 text-sm">
              {state.settings.cardsAddedSinceBackup}
            </span>
          </div>
        </div>

        {storageStatus.isSafariWarningNeeded && (
          <div className="text-xs p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 rounded-xl">
            Safari 7-day eviction defense: Add YaadKaro to your iOS / iPadOS Home Screen to guarantee permanent offline data retention.
          </div>
        )}
      </div>

      {/* Spaced Repetition Settings */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
          Spaced Repetition Configuration
        </h2>

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            Daily New Card Introduction Limit
          </label>
          <p className="text-xs text-stone-500 mb-3">
            Caps how many unlearned Box 1 cards enter your daily review to avoid review backlog overwhelm.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={state.settings.dailyNewCardLimit}
              onChange={(e) => updateSettings({ dailyNewCardLimit: Number(e.target.value) })}
              className="w-full max-w-xs accent-indigo-600"
            />
            <span className="font-mono font-bold text-sm bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-lg">
              {state.settings.dailyNewCardLimit} / day
            </span>
          </div>
        </div>

        {/* Theme setting */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
            Appearance
          </label>
          <div className="flex items-center gap-2">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => updateSettings({ theme: t })}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  state.settings.theme === t
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {t === 'light' && <Sun className="w-3.5 h-3.5" />}
                {t === 'dark' && <Moon className="w-3.5 h-3.5" />}
                {t === 'system' && <Laptop className="w-3.5 h-3.5" />}
                <span className="capitalize">{t}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Backup & Data Portability
          </h2>
        </div>
        <p className="text-xs text-stone-500">
          Export an encrypted JSON file of your entire learning state, or restore from a previous backup.
        </p>

        {importError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {importSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{importSuccess}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="button"
            onClick={handleExport}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            <span>Download Backup (.json)</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors min-h-[44px]"
          >
            <Upload className="w-4 h-4" />
            <span>Restore Backup</span>
          </button>
        </div>
      </div>

      {/* Print / PDF Physical Flashcards (Section 1.2) */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs space-y-4 print:hidden">
        <div className="flex items-center gap-2">
          <Printer className="w-5 h-5 text-indigo-500" />
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Printable Flashcard Sheets (3x3 Grid)
          </h2>
        </div>
        <p className="text-xs text-stone-500">
          Print physical double-sided study cards for offline exams or paper review backup.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <select
            value={printDeckId}
            onChange={(e) => setPrintDeckId(e.target.value)}
            className="w-full sm:w-72 p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-medium"
          >
            <option value="">Select a deck to print...</option>
            {activeDecks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.emoji} {d.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={!printDeckId}
            onClick={handlePrintDeck}
            className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[40px]"
          >
            <Printer className="w-4 h-4" />
            <span>Print {printCards.length} Cards</span>
          </button>
        </div>
      </div>

      {/* Printable 3x3 Grid (Shown only during window.print()) */}
      {selectedDeckForPrint && printCards.length > 0 && (
        <div className="hidden print:block space-y-8">
          <h2 className="text-xl font-bold text-center mb-4">
            {selectedDeckForPrint.emoji} {selectedDeckForPrint.name} ({printCards.length} Cards)
          </h2>

          <div className="grid grid-cols-3 gap-3">
            {printCards.map((card, i) => (
              <div
                key={card.id}
                className="border-2 border-dashed border-stone-400 p-4 min-h-[140px] rounded-lg flex flex-col justify-between text-xs"
              >
                <div>
                  <span className="font-bold block text-stone-800">Q#{i + 1}: {card.front}</span>
                </div>
                <div className="border-t border-stone-300 pt-2 mt-2">
                  <span className="text-stone-600 block">A: {card.back}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone: Reset All Data */}
      <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-2xl p-5 shadow-xs space-y-3 print:hidden">
        <h2 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          Danger Zone
        </h2>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          Permanently clear all local cards, decks, review history, and reset to fresh state.
        </p>
        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          Reset All Data
        </button>
      </div>

      {/* Import Mode Modal (Merge vs Replace) */}
      {showImportModeModal && pendingImportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Restore Options
            </h2>
            <p className="text-xs text-stone-500">
              Found {pendingImportData.decks.length} decks and {pendingImportData.cards.length} cards in this backup file. How would you like to restore?
            </p>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => handleApplyImport('merge')}
                className="w-full p-4 border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl text-left hover:border-indigo-400 transition-colors"
              >
                <strong className="block text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  Merge (Recommended)
                </strong>
                <span className="text-xs text-stone-600 dark:text-stone-400">
                  Keep your current cards and add new decks from the backup. Duplicate cards with identical questions will not be added twice.
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyImport('replace')}
                className="w-full p-4 border border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 rounded-xl text-left hover:border-red-400 transition-colors"
              >
                <strong className="block text-xs font-bold text-red-900 dark:text-red-200">
                  Replace Entirely
                </strong>
                <span className="text-xs text-stone-600 dark:text-stone-400">
                  Completely wipe current cards and replace with the exact state from this backup file.
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowImportModeModal(false);
                setPendingImportData(null);
              }}
              className="w-full py-2.5 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Wipe All Data?
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                This will delete all flashcards, streaks, and review histories from your browser. Type <strong className="text-red-600">RESET</strong> to confirm.
              </p>
            </div>

            <input
              type="text"
              placeholder="Type RESET"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              className="w-full text-center tracking-widest font-mono uppercase p-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500"
              autoFocus
            />

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmText('');
                }}
                className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetConfirmText.trim().toUpperCase() !== 'RESET'}
                onClick={handleExecuteReset}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                Erase Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
