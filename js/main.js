// Page bootstrap and event wiring. Dispatches on <body data-page>.

import { fetchManifest, fetchChain, fetchHints } from './chains.js';
import { createHints, nextHint } from './hints.js';
import { launchConfetti } from './confetti.js';
import {
  createGame,
  letterBank,
  keepBankOrder,
  submitWord,
  applyProgress,
  missingLetters,
  normalizeWord,
  currentWord,
} from './game.js';
import {
  loadProgress,
  saveProgress,
  clearProgress,
  loadHintTurn,
  saveHintTurn,
} from './storage.js';
import { renderList, renderError, renderGame } from './ui.js';

const page = document.body.dataset.page;

// Shown above the board at the start of a fresh chain, cleared on first tap.
const START_HINT = 'Käytä kaikki edellisen sanan kirjaimet ja yksi uusi';

if (page === 'list') {
  initListPage();
} else if (page === 'game') {
  initGamePage();
}

async function initListPage() {
  const list = document.getElementById('chain-list');
  const message = document.getElementById('list-message');
  try {
    const chains = await fetchManifest();
    message.hidden = true;
    renderList(list, chains);
  } catch {
    message.textContent = 'Ketjujen lataus epäonnistui.';
  }
}

function shuffled(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function initGamePage() {
  const refs = {
    root: document.getElementById('game-root'),
    pyramid: document.getElementById('pyramid'),
    bank: document.getElementById('bank'),
    message: document.getElementById('message'),
    giveUp: document.getElementById('give-up'),
    clear: document.getElementById('clear'),
    shuffle: document.getElementById('shuffle'),
    hint: document.getElementById('hint'),
    playAgain: document.getElementById('play-again'),
    chooseChain: document.getElementById('choose-chain'),
    infoButton: document.getElementById('info-button'),
    dialog: document.getElementById('rules-dialog'),
    quitDialog: document.getElementById('quit-dialog'),
    quitKeep: document.getElementById('quit-keep'),
    quitDiscard: document.getElementById('quit-discard'),
    quitCancel: document.getElementById('quit-cancel'),
  };

  refs.infoButton.addEventListener('click', () => refs.dialog.showModal());

  const chainId = new URLSearchParams(location.search).get('huuli');
  if (!chainId) {
    renderError(refs.root, 'Ketjua ei valittu.');
    return;
  }

  let chain;
  const hintGroups = fetchHints();
  try {
    chain = await fetchChain(chainId);
  } catch {
    renderError(refs.root, `Huulia "${chainId}" ei löytynyt.`);
    return;
  }

  let state = createGame(chain);
  applyProgress(state, loadProgress(chainId));
  // Every game started — opened, resumed or played again — takes the next
  // hint group in turn.
  const groups = await hintGroups;
  let hints;
  function startHints() {
    const turn = loadHintTurn();
    hints = createHints(groups, turn);
    if (hints.groupCount > 0) saveHintTurn((turn + 1) % hints.groupCount);
  }
  startHints();

  // Bank tiles have stable ids that survive shuffles; `order` is the
  // shuffled display order of tile ids, `input` the picked tile ids.
  let tiles = [];
  let order = [];
  let input = [];
  // Resumed games skip the hint — the player has already seen it.
  let message = state.index === 0 && state.status === 'playing' ? START_HINT : '';
  // True from the moment the last word lands until a new game starts.
  let celebrating = false;

  // A new game shuffles the bank; solving a row keeps every letter in its
  // place, so the player's eye doesn't have to find them all over again.
  function rebuildBank({ keepOrder = false } = {}) {
    // The tiles the player just spelled the word with become its root
    // letters, right where they were picked.
    const previous = keepOrder
      ? order.map((id) => ({ letter: tiles[id].letter, type: input.includes(id) ? 'root' : 'extra' }))
      : null;
    tiles = letterBank(state).map((tile, id) => ({ id, ...tile }));
    order = previous
      ? keepBankOrder(previous, tiles)
      : shuffled(tiles.map((tile) => tile.id));
    input = [];
  }

  function render() {
    renderGame(refs, {
      state,
      inputLetters: input.map((id) => tiles[id].letter),
      tiles,
      order,
      input,
      message,
      celebrating,
    });
  }

  function submit() {
    if (state.status !== 'playing' || input.length === 0) return;
    const word = input.map((id) => tiles[id].letter).join('');
    const { result } = submitWord(state, word);
    if (result === 'advanced' || result === 'won') {
      saveProgress(chainId, state);
      message = '';
      rebuildBank({ keepOrder: true });
      if (result === 'won') {
        celebrating = true;
        // Confetti lands as the reveal reaches the final word (0.3 s per row).
        setTimeout(launchConfetti, state.words.length * 300);
      }
    } else if (result === 'rejected') {
      // Tell "you dropped a letter" apart from "wrong combination".
      const missing = missingLetters(currentWord(state), word);
      message = missing.length > 0
        ? 'Sinun täytyy käyttää kaikki samat kirjaimet kuin edellisessä sanassa'
        : 'Ei etene — kokeile toista kirjainyhdistelmää.';
      input = [];
    }
    render();
  }

  function reset() {
    clearProgress(chainId);
    state = createGame(chain);
    startHints();
    celebrating = false;
    message = START_HINT;
    rebuildBank();
    render();
  }

  // Click a bank tile to add its letter to the current row — or, if it is
  // already on the row, to take it back off. Same effect as clicking the
  // letter in the pyramid, from whichever end the player reaches for.
  refs.bank.addEventListener('click', (event) => {
    const button = event.target.closest('.tile');
    if (!button || button.disabled) return;
    const tileId = Number(button.dataset.tileId);
    message = '';

    const placed = input.indexOf(tileId);
    if (placed !== -1) {
      input.splice(placed, 1);
      render();
      return;
    }

    input.push(tileId);
    // The word submits automatically once the row is full.
    if (input.length === state.words[state.index + 1].length) {
      submit();
    } else {
      render();
    }
  });

  // Click a filled box on the current row to remove that letter.
  refs.pyramid.addEventListener('click', (event) => {
    const box = event.target.closest('.box.editable');
    if (!box) return;
    input.splice(Number(box.dataset.inputIndex), 1);
    render();
  });

  refs.clear.addEventListener('click', () => {
    input = [];
    render();
  });

  refs.shuffle.addEventListener('click', () => {
    order = shuffled(order);
    render();
  });

  // Quitting never reveals the chain — it asks whether to keep the progress
  // and returns to the chain list either way.
  refs.giveUp.addEventListener('click', () => refs.quitDialog.showModal());
  refs.quitCancel.addEventListener('click', () => refs.quitDialog.close());

  refs.quitKeep.addEventListener('click', () => {
    saveProgress(chainId, state);
    location.href = 'index.html';
  });

  refs.quitDiscard.addEventListener('click', () => {
    clearProgress(chainId);
    location.href = 'index.html';
  });

  refs.playAgain.addEventListener('click', reset);
  refs.chooseChain.addEventListener('click', () => {
    location.href = 'index.html';
  });

  refs.hint.addEventListener('click', () => {
    message = nextHint(hints);
    render();
  });

  document.addEventListener('keydown', (event) => {
    if (refs.dialog.open || refs.quitDialog.open || state.status !== 'playing') return;
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      input.pop();
      render();
    } else if (/^\p{L}$/u.test(event.key)) {
      const letter = normalizeWord(event.key);
      const tileId = order.find((id) => !input.includes(id) && tiles[id].letter === letter);
      if (tileId !== undefined) {
        input.push(tileId);
        message = '';
        // The word submits automatically once the row is full.
        if (input.length === state.words[state.index + 1].length) {
          submit();
        } else {
          render();
        }
      }
    }
  });

  rebuildBank();
  render();
}
