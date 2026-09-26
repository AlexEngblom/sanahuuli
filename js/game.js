// Pure game logic for Sanahuuli. No DOM access — unit-testable in Node.

export function normalizeWord(word) {
  return word.trim().toUpperCase();
}

export function letterCounts(word) {
  const counts = new Map();
  for (const letter of word) {
    counts.set(letter, (counts.get(letter) ?? 0) + 1);
  }
  return counts;
}

export function isAnagram(a, b) {
  if (a.length !== b.length) return false;
  const remaining = letterCounts(a);
  for (const letter of b) {
    const left = remaining.get(letter) ?? 0;
    if (left === 0) return false;
    remaining.set(letter, left - 1);
  }
  return true;
}

// The letter that turns `previous` into an anagram of `next`, or null if
// `next` is not exactly `previous` plus one letter.
export function addedLetter(previous, next) {
  if (next.length !== previous.length + 1) return null;
  const remaining = letterCounts(previous);
  for (const letter of next) {
    const left = remaining.get(letter) ?? 0;
    if (left === 0) return letter;
    remaining.set(letter, left - 1);
  }
  return null;
}

// Is `next` exactly `previous` plus one letter, in any order? The chain's own
// steps and every curated alternative have to pass this.
export function followsFrom(previous, next) {
  const letter = addedLetter(previous, next);
  return letter !== null && isAnagram(previous + letter, next);
}

// Validates a word chain and returns normalized words + the added letter
// of each step. Throws on any invalid step — chain data is curated, so a
// broken chain is a bug we want to fail fast on.
export function validateChain(words) {
  if (!Array.isArray(words) || words.length < 2) {
    throw new Error('A chain needs at least two words');
  }
  const normalized = words.map(normalizeWord);
  const addedLetters = [];
  for (let i = 1; i < normalized.length; i++) {
    const previous = normalized[i - 1];
    const next = normalized[i];
    if (!followsFrom(previous, next)) {
      throw new Error(
        `Invalid chain step ${i}: "${next}" is not "${previous}" plus one letter`,
      );
    }
    addedLetters.push(addedLetter(previous, next));
  }
  return { words: normalized, addedLetters };
}

// Spellings other than the chain's own word that still advance a step.
// There is no dictionary, so the data is the only thing that can say which
// other real words are allowed — ILO + K is OLKI in the chain, but KILO is
// just as valid a word and has to be listed to be accepted.
//
// An alternative does not have to be an anagram of the chain's word: PARVI is
// RAVI + P and ARVIO is RAVI + O, and POVARI follows from either. What it must
// do is keep the chain intact, so every accepted spelling of a row has to
// follow every accepted spelling of the row above it — otherwise one branch
// would strand the player on the next row.
export function normalizeAlternatives(alternatives, words) {
  const byWord = new Map();
  for (const [word, spellings] of Object.entries(alternatives ?? {})) {
    const canonical = normalizeWord(word);
    if (!words.includes(canonical)) {
      throw new Error(`Alternatives listed for "${canonical}", which is not in the chain`);
    }
    byWord.set(canonical, spellings.map(normalizeWord));
  }
  const accepted = (rowIndex) => [words[rowIndex], ...(byWord.get(words[rowIndex]) ?? [])];
  for (let i = 1; i < words.length; i++) {
    for (const previous of accepted(i - 1)) {
      for (const spelling of accepted(i)) {
        if (!followsFrom(previous, spelling)) {
          throw new Error(`Alternative "${spelling}" is not "${previous}" plus one letter`);
        }
      }
    }
  }
  return byWord;
}

export function createGame(chain) {
  const { words, addedLetters } = validateChain(chain.words);
  const alternatives = normalizeAlternatives(chain.alternatives, words);
  // What the board shows per row. Starts as the chain's own words and is
  // overwritten with the player's spelling when they solve a row with a
  // curated alternative — writing MAINE and being shown ANIME is jarring.
  const spellings = [...words];
  return { words, addedLetters, alternatives, spellings, index: 0, status: 'playing' };
}

// Does `word` spell the step `target`? The chain's own word always does; any
// other spelling has to be curated in the chain data.
export function isAcceptedSpelling(state, target, word) {
  return word === target || (state.alternatives?.get(target) ?? []).includes(word);
}

// What is actually on the current row: the player's own spelling when they
// solved it with an alternative, otherwise the chain's word.
export function currentWord(state) {
  return state.spellings[state.index] ?? state.words[state.index];
}

// Letters still to come. Derived from the last word rather than the chain's
// own steps, so a player who took an alternative branch sees the right bank —
// the letters of the final word never depend on the route taken there.
export function remainingAddedLetters(state) {
  return missingLetters(state.words[state.words.length - 1], currentWord(state));
}

// Letter bank shown to the player: current word's letters (type 'root')
// + the remaining added letters (type 'extra'). Size stays constant.
// The type lets the UI color untouched root letters like locked-in words.
export function letterBank(state) {
  const root = [...currentWord(state)].map((letter) => ({ letter, type: 'root' }));
  const extra = remainingAddedLetters(state).map((letter) => ({ letter, type: 'extra' }));
  return [...root, ...extra];
}

// Display order for a freshly built bank that keeps every letter where it
// was. The bank always holds the final word's letters — solving a row only
// moves the added letter from 'extra' to 'root' — so each position can be
// given a tile with the same letter as before.
//
// `previous` is the old bank in display order as { letter, type }, where
// type is what that position should become: 'root' for the tiles the player
// just spelled the word with, 'extra' for the rest. With a repeated letter
// (IMEMUNAA has two Ms) this puts the lilac M on the spot the player picked,
// not on whichever M comes first. The result is tile indexes into `tiles`;
// tiles left over (only if the letters differ, which the chain never
// allows) go last so no tile is ever lost.
export function keepBankOrder(previous, tiles) {
  const free = tiles.map((_, id) => id);
  const take = (test) => {
    const at = free.findIndex(test);
    return at === -1 ? null : free.splice(at, 1)[0];
  };
  const order = [];
  for (const { letter, type } of previous) {
    const id =
      take((id) => tiles[id].letter === letter && tiles[id].type === type) ??
      take((id) => tiles[id].letter === letter);
    if (id !== null) order.push(id);
  }
  return [...order, ...free];
}

// Letters of `previous` that `word` fails to reuse. Counts duplicates, so
// reusing one A out of two reads as a missing letter — a plain "does the
// word contain this letter" test would call that word complete.
export function missingLetters(previous, word) {
  const available = letterCounts(word);
  const missing = [];
  for (const letter of previous) {
    const left = available.get(letter) ?? 0;
    if (left === 0) {
      missing.push(letter);
    } else {
      available.set(letter, left - 1);
    }
  }
  return missing;
}

// Attempt to advance with `input`. Returns { result } where result is
// 'advanced' | 'won' | 'rejected' | 'empty' | 'inactive'.
export function submitWord(state, input) {
  if (state.status !== 'playing') return { result: 'inactive' };
  const word = normalizeWord(input);
  if (word.length === 0) return { result: 'empty' };
  const target = state.words[state.index + 1];
  if (!isAcceptedSpelling(state, target, word)) return { result: 'rejected' };
  state.index += 1;
  state.spellings[state.index] = word;
  if (state.index === state.words.length - 1) {
    state.status = 'won';
    return { result: 'won' };
  }
  return { result: 'advanced' };
}

// Restores the spellings a player solved rows with. Anything that no longer
// fits the chain is dropped back to the chain's own word — a chain edited
// since the save must never put a stale word on the board.
function applySpellings(state, spellings) {
  if (!Array.isArray(spellings) || spellings.length !== state.words.length) return;
  state.spellings = state.words.map((word, rowIndex) => {
    if (rowIndex > state.index) return word;
    const saved = normalizeWord(String(spellings[rowIndex] ?? ''));
    return isAcceptedSpelling(state, word, saved) ? saved : word;
  });
}

// Restores saved localStorage progress into a fresh game state.
export function applyProgress(state, progress) {
  const index = Math.min(
    Math.max(0, Number(progress?.index) || 0),
    state.words.length - 1,
  );
  state.index = index;
  if (progress?.status === 'won') {
    state.status = 'won';
  }
  applySpellings(state, progress?.spellings);
  return state;
}
