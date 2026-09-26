// Hint button messages. Pure logic, no DOM — unit-testable in Node.
//
// data/hints.json holds groups of lines (song lyrics). Each new game takes
// the next group in turn, wrapping back to the first after the last one,
// and the hint button walks through that group's lines in order, starting
// over once the group runs out.

// `turn` counts games started; it picks the group, so it is taken modulo the
// group count here — adding groups to the data never breaks a stored turn.
export function createHints(groups, turn = 0) {
  const usable = (Array.isArray(groups) ? groups : []).filter(
    (group) => Array.isArray(group) && group.length > 0,
  );
  if (usable.length === 0) return { lines: [], next: 0, groupCount: 0 };
  const index = ((Math.floor(turn) % usable.length) + usable.length) % usable.length;
  return { lines: usable[index], next: 0, groupCount: usable.length };
}

// The line to show for this press, advancing to the next one. An empty
// string when there are no hints at all.
export function nextHint(hints) {
  if (hints.lines.length === 0) return '';
  const line = hints.lines[hints.next];
  hints.next = (hints.next + 1) % hints.lines.length;
  return line;
}
