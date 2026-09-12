// DOM rendering. All game decisions live in game.js — this module only draws.

export function renderList(listEl, chains) {
  const items = chains.map((chain) => {
    const link = document.createElement('a');
    link.href = `peli.html?juuri=${encodeURIComponent(chain.id)}`;
    link.className = 'chain-link';

    const name = document.createElement('span');
    name.className = 'chain-name';
    name.textContent = chain.name;
    link.append(name);

    if (chain.description) {
      const description = document.createElement('span');
      description.className = 'chain-description';
      description.textContent = chain.description;
      link.append(description);
    }

    const item = document.createElement('li');
    item.append(link);
    return item;
  });
  listEl.replaceChildren(...items);
}

export function renderError(root, text) {
  const message = document.createElement('p');
  message.textContent = text;
  const back = document.createElement('a');
  back.href = 'index.html';
  back.textContent = 'Takaisin listaan';
  const box = document.createElement('div');
  box.className = 'error-box';
  box.append(message, back);
  root.replaceChildren(box);
}

// model: { state, inputLetters, tiles, order, input, message }
export function renderGame(refs, model) {
  renderPyramid(refs.pyramid, model);
  renderBank(refs.bank, model);

  const playing = model.state.status === 'playing';
  refs.giveUp.hidden = !playing;
  refs.clear.hidden = !playing;
  refs.shuffle.hidden = !playing;
  refs.playAgain.hidden = playing;

  if (model.state.status === 'won') {
    refs.message.textContent = 'Huuli huulteltu! 🎉';
  } else if (model.state.status === 'given-up') {
    refs.message.textContent = 'Peli lopetettu — tässä koko ketju.';
  } else {
    refs.message.textContent = model.message ?? '';
  }
}

function renderPyramid(pyramid, { state, inputLetters }) {
  const playing = state.status === 'playing';
  const inputRow = state.index + 1;
  const rows = state.words.map((word, rowIndex) => {
    const row = document.createElement('div');
    row.className = 'row';

    // Solved rows (including the revealed starting word) are filled, the
    // next row shows the in-progress input, future rows stay empty.
    // A finished game reveals every row.
    let letters = [];
    if (!playing || rowIndex <= state.index) {
      letters = [...word];
    } else if (rowIndex === inputRow) {
      letters = inputLetters;
    }

    for (let i = 0; i < word.length; i++) {
      const box = document.createElement('button');
      box.type = 'button';
      box.className = 'box';
      box.tabIndex = -1;
      const letter = letters[i];
      if (letter) {
        box.textContent = letter;
        // In-progress input is highlighted differently from locked rows.
        const isInput = playing && rowIndex === inputRow;
        box.classList.add(isInput ? 'pending' : 'filled');
      }
      if (playing && rowIndex === inputRow) {
        if (i < inputLetters.length) {
          box.dataset.inputIndex = String(i);
          box.classList.add('editable');
        } else if (i === inputLetters.length) {
          box.classList.add('cursor');
        }
      }
      row.append(box);
    }
    return row;
  });
  pyramid.replaceChildren(...rows);
}

function renderBank(bank, { tiles, order, input, state }) {
  const playing = state.status === 'playing';
  const used = new Set(input);
  const buttons = order.map((tileId) => {
    const tile = tiles[tileId];
    const button = document.createElement('button');
    button.type = 'button';
    // Picked tiles get the blue highlight; untouched root letters are
    // lilac like locked-in words; untouched extra letters stay grey.
    if (used.has(tileId)) {
      button.className = 'tile picked';
    } else {
      button.className = tile.type === 'root' ? 'tile root' : 'tile';
    }
    button.textContent = tile.letter;
    button.dataset.tileId = String(tileId);
    button.disabled = !playing || used.has(tileId);
    return button;
  });
  bank.replaceChildren(...buttons);
}
