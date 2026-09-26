import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHints, nextHint } from '../js/hints.js';

test('hints walk through the drawn group and start over', () => {
  const hints = createHints([['yksi', 'kaksi', 'kolme']]);
  assert.deepEqual(
    [nextHint(hints), nextHint(hints), nextHint(hints), nextHint(hints)],
    ['yksi', 'kaksi', 'kolme', 'yksi'],
  );
});

test('each game takes the next group, wrapping around', () => {
  const groups = [['a1', 'a2'], ['b1', 'b2'], ['c1', 'c2']];
  const firstLines = [0, 1, 2, 3, 4].map((turn) => nextHint(createHints(groups, turn)));
  assert.deepEqual(firstLines, ['a1', 'b1', 'c1', 'a1', 'b1']);
  assert.equal(createHints(groups, 0).groupCount, 3);
});

test('missing or empty hint data gives no hints instead of failing', () => {
  assert.equal(nextHint(createHints([])), '');
  assert.equal(nextHint(createHints(undefined)), '');
  // Empty groups are never drawn.
  assert.equal(nextHint(createHints([[], ['ainoa']], 0)), 'ainoa');
});

test('shipped hint data is a list of non-empty line groups', async () => {
  const url = new URL('../data/hints.json', import.meta.url);
  const groups = JSON.parse(await readFile(url, 'utf8'));
  assert.ok(Array.isArray(groups) && groups.length > 0);
  for (const group of groups) {
    assert.ok(Array.isArray(group) && group.length > 0);
    for (const line of group) assert.equal(typeof line, 'string');
  }
});
