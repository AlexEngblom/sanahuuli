import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  missingLetters,
  normalizeAlternatives,
  isAcceptedSpelling,
  validateChain,
  createGame,
  submitWord,
  applyProgress,
  isAnagram,
  addedLetter,
  letterBank,
  currentWord,
} from '../js/game.js';

const HUULI_1 = ['AIE', 'AINE', 'ANIME', 'ANEMIA', 'AINEUMA', 'IMEMUNAA'];

test('validateChain normalizes case and derives added letters', () => {
  const { words, addedLetters } = validateChain(['Aie', 'Aine', 'Anime', 'Anemia', 'Aineuma', 'Imemunaa']);
  assert.deepEqual(words, HUULI_1);
  assert.deepEqual(addedLetters, ['N', 'M', 'A', 'U', 'M']);
});

test('validateChain throws on an invalid step', () => {
  assert.throws(() => validateChain(['ILO', 'AUTO'])); // too many new letters
  assert.doesNotThrow(() => validateChain(['ILO', 'ILOT'])); // sanity check: valid step passes
});

test('validateChain rejects a step that swaps letters', () => {
  assert.throws(() => validateChain(['ABC', 'ABXY'])); // two new letters
  assert.throws(() => validateChain(['ÄLÄ', 'ALAS'])); // umlauts are distinct: ÄLÄ + S ≠ ALAS
  assert.throws(() => validateChain(['ILO'])); // too short chain
});

test('addedLetter finds the single new letter, umlauts included', () => {
  assert.equal(addedLetter('ILO', 'OLKI'), 'K');
  assert.equal(addedLetter('AIE', 'AINE'), 'N');
  assert.equal(addedLetter('ÄLÄ', 'ÄLÄS'), 'S');
  // First uncovered letter is returned; the anagram check in validateChain
  // is what actually rejects this step (A is not in ÄLÄ).
  assert.equal(addedLetter('ÄLÄ', 'ALAS'), 'A');
  assert.equal(addedLetter('ILO', 'ILO'), null);
});

test('isAnagram compares letter multisets', () => {
  assert.ok(isAnagram('KILO', 'OLKI'));
  assert.ok(!isAnagram('KILO', 'OLKA'));
  assert.ok(!isAnagram('KILO', 'KILOGRAMMI'));
});

test('full playthrough wins the game', () => {
  const state = createGame({ words: HUULI_1 });
  assert.equal(currentWord(state), 'AIE');
  assert.equal(submitWord(state, 'AINE').result, 'advanced');
  assert.equal(submitWord(state, 'ANIME').result, 'advanced');
  assert.equal(submitWord(state, 'ANEMIA').result, 'advanced');
  assert.equal(submitWord(state, 'AINEUMA').result, 'advanced');
  assert.equal(submitWord(state, 'IMEMUNAA').result, 'won');
  assert.equal(state.status, 'won');
  // No moves after the game is over.
  assert.equal(submitWord(state, 'IMEMUNAA').result, 'inactive');
});

test('a jumble of the right letters does not advance', () => {
  const state = createGame({ words: HUULI_1 });
  // The letters of AINE in an order that spells nothing. Accepting this let
  // a player brute-force the chain by tapping tiles in any order at all.
  assert.equal(submitWord(state, 'ENIA').result, 'rejected');
  assert.equal(submitWord(state, 'IENA').result, 'rejected');
  assert.equal(state.index, 0);
  assert.equal(submitWord(state, 'AINE').result, 'advanced');
});

test('curated alternative spellings advance', () => {
  const state = createGame({
    words: ['ILO', 'OLKI'],
    alternatives: { OLKI: ['KILO'] },
  });
  assert.ok(isAcceptedSpelling(state, 'OLKI', 'KILO'));
  assert.ok(isAcceptedSpelling(state, 'OLKI', 'OLKI'));
  assert.ok(!isAcceptedSpelling(state, 'OLKI', 'OLIK')); // not a word, not listed
  assert.equal(submitWord(state, 'KILO').result, 'won');
});

test('normalizeAlternatives rejects miscurated data', () => {
  const words = ['ILO', 'OLKI'];
  // An alternative has to be an anagram of the word it stands in for.
  assert.throws(() => normalizeAlternatives({ OLKI: ['OLKA'] }, words), /not an anagram/);
  // ...and it has to belong to a word that is actually in the chain.
  assert.throws(() => normalizeAlternatives({ KISSA: ['SIKAS'] }, words), /not in the chain/);
  // Case is normalized on the way in, like the chain itself.
  assert.deepEqual(normalizeAlternatives({ olki: ['kilo'] }, words).get('OLKI'), ['KILO']);
  assert.equal(normalizeAlternatives(undefined, words).size, 0);
});

test('wrong words are rejected without advancing', () => {
  const state = createGame({ words: HUULI_1 });
  assert.equal(submitWord(state, 'AIE').result, 'rejected'); // missing the new letter
  assert.equal(submitWord(state, 'AIET').result, 'rejected'); // wrong added letter
  assert.equal(submitWord(state, 'ANIME').result, 'rejected'); // skipping a step
  assert.equal(submitWord(state, 'ENIA').result, 'rejected'); // right letters, not a word
  assert.equal(submitWord(state, '').result, 'empty');
  assert.equal(state.index, 0);
  assert.equal(state.status, 'playing');
});

test('lowercase input is accepted', () => {
  const state = createGame({ words: HUULI_1 });
  assert.equal(submitWord(state, 'aine').result, 'advanced');
});

test('letter bank = current word + remaining added letters, constant size', () => {
  const state = createGame({ words: HUULI_1 });
  const size = letterBank(state).length;
  // AIE + remaining added letters N, M, A, U, M (M appears twice in the chain).
  assert.deepEqual([...letterBank(state).map((t) => t.letter)].sort(), [...'AAEIMMNU'].sort());
  submitWord(state, 'AINE');
  assert.equal(letterBank(state).length, size);
  // AINE + remaining M, A, U, M — bank size stays constant.
  assert.deepEqual([...letterBank(state).map((t) => t.letter)].sort(), [...'AAEIMMNU'].sort());
});

test('applyProgress restores and clamps saved progress', () => {
  const state = createGame({ words: HUULI_1 });
  applyProgress(state, { index: 2, status: 'playing' });
  assert.equal(state.index, 2);
  assert.equal(currentWord(state), 'ANIME');
  applyProgress(state, { index: 999, status: 'won' });
  assert.equal(state.index, HUULI_1.length - 1);
  assert.equal(state.status, 'won');
  const fresh = createGame({ words: HUULI_1 });
  applyProgress(fresh, null);
  assert.equal(fresh.index, 0);
  // Stale saves from the old give-up flow resume as a normal game.
  applyProgress(fresh, { index: 1, status: 'given-up' });
  assert.equal(fresh.status, 'playing');
});

test('missingLetters counts duplicates, not just presence', () => {
  // Reachable in huuli-1: on the ANEMIA row the player uses one A and both
  // M tiles. Every letter of ANEMIA appears in the word, but one A is gone.
  assert.deepEqual(missingLetters('ANEMIA', 'ANEMIUM'), ['A']);
  // A dropped unique letter was already reported correctly.
  assert.deepEqual(missingLetters('ANEMIA', 'AAEMIUM'), ['N']);
  // Reusing every letter, in any order, leaves nothing missing.
  assert.deepEqual(missingLetters('ANEMIA', 'AINEUMA'), []);
  assert.deepEqual(missingLetters('AIE', 'AIET'), []);
  assert.deepEqual(missingLetters('ÄLÄ', 'ALAS'), ['Ä', 'Ä']);
});

test('all chains shipped in the repo are valid', async () => {
  const manifestUrl = new URL('../data/chains/manifest.json', import.meta.url);
  const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
  assert.ok(manifest.length > 0, 'manifest should list at least one chain');
  for (const entry of manifest) {
    const chainUrl = new URL(`../data/chains/${entry.id}.json`, import.meta.url);
    const chain = JSON.parse(await readFile(chainUrl, 'utf8'));
    assert.equal(chain.id, entry.id, `id mismatch in ${entry.id}.json`);
    assert.doesNotThrow(() => validateChain(chain.words), `invalid chain: ${entry.id}`);
  }
});
