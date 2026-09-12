// Page bootstrap and event wiring. Dispatches on <body data-page>.

import { fetchManifest, fetchChain } from './chains.js';
import {
  createGame,
  letterBank,
  submitWord,
  giveUp,
  applyProgress,
  normalizeWord,
} from './game.js';
import { loadProgress, saveProgress, clearProgress } from './storage.js';
import { renderList, renderError, renderGame } from './ui.js';

const page = document.body.dataset.page;

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
    playAgain: document.getElementById('play-again'),
    infoButton: document.getElementById('info-button'),
    dialog: document.getElementById('rules-dialog'),
  };

  refs.infoButton.addEventListener('click', () => refs.dialog.showModal());

  const chainId = new URLSearchParams(location.search).get('juuri');
  if (!chainId) {
    renderError(refs.root, 'Ketjua ei valittu.');
    return;
  }

  let chain;
  try {
    chain = await fetchChain(chainId);
  } catch {
    renderError(refs.root, `Huulia "${chainId}" ei löytynyt.`);
    return;
  }

  let state = createGame(chain);
  applyProgress(state, loadProgress(chainId));

  // Bank tiles have stable ids that survive shuffles; `order` is the
  // shuffled display order of tile ids, `input` the picked tile ids.
  let tiles = [];
  let order = [];
  let input = [];
  let message = '';

  function rebuildBank() {
    tiles = letterBank(state).map((tile, id) => ({ id, ...tile }));
    order = shuffled(tiles.map((tile) => tile.id));
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
    });
  }

  function submit() {
    if (state.status !== 'playing' || input.length === 0) return;
    const word = input.map((id) => tiles[id].letter).join('');
    const { result } = submitWord(state, word);
    if (result === 'advanced' || result === 'won') {
      saveProgress(chainId, state);
      message = '';
      rebuildBank();
    } else if (result === 'rejected') {
      message = 'Ei etene — kokeile toista kirjainyhdistelmää.';
    }
    render();
  }

  function reset() {
    clearProgress(chainId);
    state = createGame(chain);
    message = '';
    rebuildBank();
    render();
  }

  // Click a bank tile to add its letter to the current row.
  refs.bank.addEventListener('click', (event) => {
    const button = event.target.closest('.tile');
    if (!button || button.disabled) return;
    input.push(Number(button.dataset.tileId));
    message = '';
    render();
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

  refs.giveUp.addEventListener('click', () => {
    giveUp(state);
    saveProgress(chainId, state);
    render();
  });

  refs.playAgain.addEventListener('click', reset);

  document.addEventListener('keydown', (event) => {
    if (refs.dialog.open || state.status !== 'playing') return;
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
        render();
      }
    }
  });

  rebuildBank();
  render();
}
