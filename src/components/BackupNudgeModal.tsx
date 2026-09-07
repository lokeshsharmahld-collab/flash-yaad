import React, { useState, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState';
import { exportFullData } from '../lib/exportImport';
import { Download, ShieldCheck, X } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export const BackupNudgeModal: React.FC = () => {
  const { state, recordBackupDownloaded } = useAppState();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only evaluate if user has cards
    if (state.cards.length === 0) return;

    const cardsAdded = state.settings.cardsAddedSinceBackup;
    let daysSinceLastBackup = 999;

    if (state.settings.lastBackupAt) {
      try {
        daysSinceLastBackup = differenceInDays(new Date(), parseISO(state.settings.lastBackupAt));
      } catch {
        daysSinceLastBackup = 999;
      }
    } else {
      daysSinceLastBackup = 10;
    }

    if (daysSinceLastBackup >= 7 || cardsAdded >= 50) {
      setIsOpen(true);
    }
  }, [state.settings.cardsAddedSinceBackup, state.settings.lastBackupAt, state.cards.length]);

  if (!isOpen) return null;

  const estimatedKb = Math.max(1, Math.round(JSON.stringify(state).length / 1024));

  const handleDownload = () => {
    exportFullData(state);
    recordBackupDownloaded();
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        className="max-w-md w-full bg-white dark:bg-stone-900 rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Time for a quick backup?
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            All your flashcards are stored locally on this device. Downloading a quick backup ensures you never lose your hard work.
          </p>
        </div>

        <div className="p-3 bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 rounded-xl flex items-center justify-between text-xs text-stone-600 dark:text-stone-300">
          <span>Estimated file size</span>
          <span className="font-semibold text-stone-900 dark:text-stone-100 font-mono">~{estimatedKb} KB</span>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-sm font-medium transition-colors"
          >
            Remind me later
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Backup
          </button>
        </div>
      </div>
    </div>
  );
};
