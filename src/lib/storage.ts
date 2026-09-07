import { get, set, del } from 'idb-keyval';
import LZString from 'lz-string';
import { RootState, createInitialState, migrate } from './schema';

export type StorageMode = 'indexeddb' | 'localstorage' | 'memory';

const STORAGE_KEY_MAIN = 'yaadkaro_state';
const STORAGE_KEY_TMP = 'yaadkaro_state_tmp';
const STORAGE_KEY_PROBE = 'yaadkaro_probe';

interface StorageStatus {
  mode: StorageMode;
  isPersisted: boolean;
  quotaExceeded: boolean;
  isSafariWarningNeeded: boolean;
}

let currentMode: StorageMode = 'memory';
let isStoragePersisted = false;
let isQuotaExceeded = false;
let inMemoryState: RootState = createInitialState();
let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;
let pendingStateToSave: RootState | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Storage listener error:', e);
    }
  });
}

export function subscribeStorageStatus(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getStorageStatus(): StorageStatus {
  const isSafari =
    typeof navigator !== 'undefined' &&
    /Safari/i.test(navigator.userAgent) &&
    !/Chrome|CriOS/i.test(navigator.userAgent);

  return {
    mode: currentMode,
    isPersisted: isStoragePersisted,
    quotaExceeded: isQuotaExceeded,
    isSafariWarningNeeded: isSafari,
  };
}

/**
 * Storage startup probe: Tests IDB, then localStorage, then falls back to memory.
 */
export async function initStorage(): Promise<{ state: RootState; mode: StorageMode }> {
  currentMode = 'memory';

  // 1. Try IndexedDB Probe
  try {
    if (typeof indexedDB !== 'undefined') {
      await set(STORAGE_KEY_PROBE, '1');
      const val = await get<string>(STORAGE_KEY_PROBE);
      if (val === '1') {
        await del(STORAGE_KEY_PROBE);
        currentMode = 'indexeddb';

        if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
          navigator.storage.persist().then((persisted) => {
            isStoragePersisted = persisted;
            notifyListeners();
          }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn('IndexedDB probe failed, attempting localStorage fallback', err);
  }

  // 2. If IDB failed, try localStorage
  if (currentMode === 'memory' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY_PROBE, '1');
      if (window.localStorage.getItem(STORAGE_KEY_PROBE) === '1') {
        window.localStorage.removeItem(STORAGE_KEY_PROBE);
        currentMode = 'localstorage';
      }
    } catch (err) {
      console.warn('localStorage probe failed, using in-memory mode', err);
      currentMode = 'memory';
    }
  }

  // 3. Load existing state
  const loadedState = await loadPersistedState();
  inMemoryState = loadedState;
  setupFlushOnUnload();
  notifyListeners();

  return { state: inMemoryState, mode: currentMode };
}

/**
 * Attempt to load state, with fallback to tmp recovery if main is corrupted.
 */
async function loadPersistedState(): Promise<RootState> {
  if (currentMode === 'memory') {
    return createInitialState();
  }

  // Try loading from main key
  let raw: unknown = null;
  try {
    if (currentMode === 'indexeddb') {
      raw = await get(STORAGE_KEY_MAIN);
    } else if (currentMode === 'localstorage') {
      const compressed = window.localStorage.getItem(STORAGE_KEY_MAIN);
      if (compressed) {
        const decompressed = LZString.decompress(compressed);
        if (decompressed) {
          raw = JSON.parse(decompressed);
        }
      }
    }

    if (raw) {
      return migrate(raw);
    }
  } catch (mainErr) {
    console.warn('Failed to parse main state, attempting tmp recovery', mainErr);
  }

  // If main failed or was empty, check tmp key for recovery
  try {
    let tmpRaw: unknown = null;
    if (currentMode === 'indexeddb') {
      tmpRaw = await get(STORAGE_KEY_TMP);
    } else if (currentMode === 'localstorage') {
      const compressedTmp = window.localStorage.getItem(STORAGE_KEY_TMP);
      if (compressedTmp) {
        const decompressed = LZString.decompress(compressedTmp);
        if (decompressed) {
          tmpRaw = JSON.parse(decompressed);
        }
      }
    }

    if (tmpRaw) {
      const recovered = migrate(tmpRaw);
      console.info('Successfully recovered state from tmp key');
      // Repair main key with the recovered state
      await writeDirect(recovered);
      return recovered;
    }
  } catch (tmpErr) {
    console.error('Tmp recovery also failed', tmpErr);
  }

  return createInitialState();
}

/**
 * Low-level atomic write to storage
 */
async function writeDirect(state: RootState): Promise<void> {
  if (currentMode === 'memory') {
    return;
  }

  try {
    if (currentMode === 'indexeddb') {
      // Atomic 2-step write: write tmp, copy to main, delete tmp
      await set(STORAGE_KEY_TMP, state);
      await set(STORAGE_KEY_MAIN, state);
      await del(STORAGE_KEY_TMP);
    } else if (currentMode === 'localstorage') {
      const json = JSON.stringify(state);
      const compressed = LZString.compress(json);
      window.localStorage.setItem(STORAGE_KEY_TMP, compressed);
      window.localStorage.setItem(STORAGE_KEY_MAIN, compressed);
      window.localStorage.removeItem(STORAGE_KEY_TMP);
    }
    isQuotaExceeded = false;
  } catch (err: unknown) {
    const errorName = (err as { name?: string })?.name;
    if (errorName === 'QuotaExceededError' || errorName === 'NS_ERROR_DOM_QUOTA_REACHED') {
      isQuotaExceeded = true;
      notifyListeners();
    }
    console.error('Storage write failed:', err);
    throw err;
  }
}

/**
 * Debounced save: updates in-memory copy immediately, persists after 500ms
 */
export function saveStateDebounced(state: RootState): void {
  inMemoryState = state;
  pendingStateToSave = state;

  if (saveTimeoutId) {
    clearTimeout(saveTimeoutId);
  }

  saveTimeoutId = setTimeout(() => {
    flushPendingSave();
  }, 500);
}

/**
 * Immediate synchronous flush of any pending save.
 */
export async function flushPendingSave(): Promise<void> {
  if (saveTimeoutId) {
    clearTimeout(saveTimeoutId);
    saveTimeoutId = null;
  }

  if (pendingStateToSave) {
    const toSave = pendingStateToSave;
    pendingStateToSave = null;
    try {
      await writeDirect(toSave);
    } catch (e) {
      console.error('Failed to flush storage save:', e);
    }
  }
}

/**
 * Setup flush on tab visibility change (hidden) and beforeunload.
 */
function setupFlushOnUnload() {
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushPendingSave();
      }
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      flushPendingSave();
    });
  }
}

/**
 * Clears all stored data (for reset or replace).
 */
export async function clearStorage(): Promise<void> {
  inMemoryState = createInitialState();
  pendingStateToSave = null;
  if (saveTimeoutId) {
    clearTimeout(saveTimeoutId);
    saveTimeoutId = null;
  }

  try {
    if (currentMode === 'indexeddb') {
      await del(STORAGE_KEY_MAIN);
      await del(STORAGE_KEY_TMP);
    } else if (currentMode === 'localstorage') {
      window.localStorage.removeItem(STORAGE_KEY_MAIN);
      window.localStorage.removeItem(STORAGE_KEY_TMP);
    }
  } catch (e) {
    console.error('Error clearing storage:', e);
  }
}
