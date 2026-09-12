// Game progress persistence in localStorage. All access is wrapped in
// try/catch — if storage is unavailable (private mode etc.) the game
// still works, it just doesn't remember.

const PREFIX = 'sanahuuli:progress:';

export function loadProgress(chainId) {
  try {
    const raw = localStorage.getItem(PREFIX + chainId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProgress(chainId, state) {
  try {
    const snapshot = { index: state.index, status: state.status };
    localStorage.setItem(PREFIX + chainId, JSON.stringify(snapshot));
  } catch {
    // Storage unavailable — play on without persistence.
  }
}

export function clearProgress(chainId) {
  try {
    localStorage.removeItem(PREFIX + chainId);
  } catch {
    // Storage unavailable — nothing to clear.
  }
}
