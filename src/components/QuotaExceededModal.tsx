import React from 'react';
import { useAppState } from '../hooks/useAppState';
import { exportFullData } from '../lib/exportImport';
import { AlertOctagon, Download } from 'lucide-react';

export const QuotaExceededModal: React.FC = () => {
  const { storageStatus, state } = useAppState();

  if (!storageStatus.quotaExceeded) {
    return null;
  }

  const handleExport = () => {
    exportFullData(state);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        role="alertdialog"
        aria-modal="true"
        className="max-w-md w-full bg-white dark:bg-stone-900 rounded-2xl p-6 border border-red-200 dark:border-red-900/60 shadow-2xl space-y-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
          <AlertOctagon className="w-6 h-6" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Browser Storage Full
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Your device browser has run out of local storage quota for this site. To prevent losing your current flashcards, please export your data file now.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleExport}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Your Data Now
          </button>
        </div>
      </div>
    </div>
  );
};
