import React from 'react';
import { useAppState } from '../hooks/useAppState';
import { exportFullData } from '../lib/exportImport';
import { AlertTriangle, Download, X, Compass } from 'lucide-react';

export const StorageBanner: React.FC = () => {
  const { storageStatus, state, dismissSafariWarning } = useAppState();

  const isMemoryMode = storageStatus.mode === 'memory';
  const showSafariWarning = storageStatus.isSafariWarningNeeded;

  if (!isMemoryMode && !showSafariWarning) {
    return null;
  }

  return (
    <div className="space-y-2 mb-4">
      {isMemoryMode && (
        <div
          role="alert"
          className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-4 py-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm text-sm"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Private/restricted mode detected:</strong> your data will <strong>NOT</strong> be saved after closing the tab.
            </span>
          </div>
          <button
            type="button"
            onClick={() => exportFullData(state)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export before closing
          </button>
        </div>
      )}

      {showSafariWarning && !isMemoryMode && (
        <div
          role="region"
          aria-label="Safari storage notification"
          className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 px-4 py-3 rounded-xl flex items-center justify-between gap-3 shadow-sm text-xs sm:text-sm"
        >
          <div className="flex items-center gap-2.5">
            <Compass className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span>
              Add YaadKaro to your Home Screen so your data isn't auto-deleted by Safari after 7 days of inactivity.
            </span>
          </div>
          <button
            type="button"
            onClick={dismissSafariWarning}
            className="text-sky-700 dark:text-sky-300 hover:text-sky-900 dark:hover:text-white p-1 rounded-md transition-colors"
            title="Dismiss tip"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
