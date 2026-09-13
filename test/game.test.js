import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
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

test('full playthrough with anagrams wins the game', () => {
  const state = createGame({ words: HUULI_1 });
  assert.equal(currentWord(state), 'AIE');
  // Play every step as an anagram of the target word where possible.
  assert.equal(submitWord(state, 'ENIA').result, 'advanced'); // AINE
  assert.equal(submitWord(state, 'MEINA').result, 'advanced'); // ANIME
  assert.equal(submitWord(state, 'ANEMIA').result, 'advanced');
  assert.equal(submitWord(state, 'AINEUMA').result, 'advanced');
  assert.equal(submitWord(state, 'IMEMUNAA').result, 'won');
  assert.equal(state.status, 'won');
  // No moves after the game is over.
  assert.equal(submitWord(state, 'IMEMUNAA').result, 'inactive');
});

test('wrong words are rejected without advancing', () => {
  const state = createGame({ words: HUULI_1 });
  assert.equal(submitWord(state, 'AIE').result, 'rejected'); // missing the new letter
  assert.equal(submitWord(state, 'AIET').result, 'rejected'); // wrong added letter
  assert.equal(submitWord(state, 'ANIME').result, 'rejected'); // skipping a step
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
