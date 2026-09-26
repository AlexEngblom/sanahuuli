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
    const snapshot = {
      index: state.index,
      status: state.status,
      spellings: state.spellings,
    };
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

// Which hint group the next game gets. Shared by all chains, so every new
// game — whichever chain it is — moves on to the next group.
const HINT_TURN_KEY = 'sanahuuli:hint-turn';

export function loadHintTurn() {
  try {
    return Number(localStorage.getItem(HINT_TURN_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function saveHintTurn(turn) {
  try {
    localStorage.setItem(HINT_TURN_KEY, String(turn));
  } catch {
    // Storage unavailable — every game starts from the first group.
  }
}
