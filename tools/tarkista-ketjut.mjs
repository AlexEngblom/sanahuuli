// Tarkistaa kaikki data/chains-ketjut pelin omalla logiikalla: jokainen rivi on
// edellinen + yksi kirjain, ja vaihtoehtoiset kirjoitusasut ovat anagrammeja.
//
//   node tools/tarkista-ketjut.mjs

import { readFileSync } from 'node:fs';
import { createGame } from '../js/game.js';

const manifest = JSON.parse(readFileSync('data/chains/manifest.json', 'utf8'));
let virheita = 0;

for (const { id } of manifest) {
  try {
    const chain = JSON.parse(readFileSync(`data/chains/${id}.json`, 'utf8'));
    if (chain.id !== id) throw new Error(`tiedoston id on "${chain.id}", manifestissa "${id}"`);
    const peli = createGame(chain);
    console.log(`  ok   ${id}  ${peli.words.join(' → ')}`);
  } catch (virhe) {
    virheita++;
    console.log(`  RIKKI ${id}  ${virhe.message}`);
  }
}

console.log(virheita === 0 ? `\n${manifest.length} ketjua, kaikki kunnossa.` : `\n${virheita} rikki.`);
process.exit(virheita === 0 ? 0 : 1);
