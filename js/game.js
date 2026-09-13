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
    const letter = addedLetter(previous, next);
    if (letter === null || !isAnagram(previous + letter, next)) {
      throw new Error(
        `Invalid chain step ${i}: "${next}" is not "${previous}" plus one letter`,
      );
    }
    addedLetters.push(letter);
  }
  return { words: normalized, addedLetters };
}

// Spellings other than the chain's own word that still advance a step.
// There is no dictionary, so the data is the only thing that can say which
// other real words are allowed — ILO + K is OLKI in the chain, but KILO is
// just as valid a word and has to be listed to be accepted.
export function normalizeAlternatives(alternatives, words) {
  const byWord = new Map();
  for (const [word, spellings] of Object.entries(alternatives ?? {})) {
    const canonical = normalizeWord(word);
    if (!words.includes(canonical)) {
      throw new Error(`Alternatives listed for "${canonical}", which is not in the chain`);
    }
    const normalized = spellings.map(normalizeWord);
    for (const spelling of normalized) {
      if (!isAnagram(spelling, canonical)) {
        throw new Error(`Alternative "${spelling}" is not an anagram of "${canonical}"`);
      }
    }
    byWord.set(canonical, normalized);
  }
  return byWord;
}

export function createGame(chain) {
  const { words, addedLetters } = validateChain(chain.words);
  const alternatives = normalizeAlternatives(chain.alternatives, words);
  return { words, addedLetters, alternatives, index: 0, status: 'playing' };
}

// Does `word` spell the step `target`? The chain's own word always does; any
// other spelling has to be curated in the chain data.
export function isAcceptedSpelling(state, target, word) {
  return word === target || (state.alternatives?.get(target) ?? []).includes(word);
}

export function currentWord(state) {
  return state.words[state.index];
}

export function remainingAddedLetters(state) {
  return state.addedLetters.slice(state.index);
}

// Letter bank shown to the player: current word's letters (type 'root')
// + the remaining added letters (type 'extra'). Size stays constant.
// The type lets the UI color untouched root letters like locked-in words.
export function letterBank(state) {
  const root = [...currentWord(state)].map((letter) => ({ letter, type: 'root' }));
  const extra = remainingAddedLetters(state).map((letter) => ({ letter, type: 'extra' }));
  return [...root, ...extra];
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
  if (state.index === state.words.length - 1) {
    state.status = 'won';
    return { result: 'won' };
  }
  return { result: 'advanced' };
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
  return state;
}
