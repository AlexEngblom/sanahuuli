// Etsii sanajuuria: ketjuja, joissa jokainen sana on edellinen + yksi uusi kirjain
// (kirjainjärjestys saa vaihtua). Sanasto: Kotuksen nykysuomen sanalista, eli
// mukana ovat vain perusmuodot — ei taivutusmuotoja.
//
//   node tools/juuri.mjs NAIMATON HÄÄMATKA        tutki yksi tai useampi sana
//   node tools/juuri.mjs --kaikki NAIMATON        tulosta kaikki ketjut, ei vain näyte
//   node tools/juuri.mjs --lyhin 4 NAIMATON       lopeta neljään kirjaimeen
//   node tools/juuri.mjs --naytteita 10 NAIMATON  montako ketjua tulostetaan
//   node tools/juuri.mjs --sisaltaa SIMA AVIOMIES  vain ketjut joissa tämä sana
//   node tools/juuri.mjs --kasvata KRAPULA        mihin sanoihin tästä pääsee ylöspäin
//   node tools/juuri.mjs --keksitty ANTTIMAN      huippusana saa olla keksitty
//   node tools/juuri.mjs --ketju "APU RAPU KRAPU"  tulosta ketju valmiina JSON:na
//   node tools/juuri.mjs --miksi MULKUTUS         näytä rivi riviltä mihin ketju kaatuu
//   node tools/juuri.mjs --lisaa KADOTTI DIKTATOR kelpuuta myös omat sanamuodot

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const SANALISTA = join(HERE, 'nykysuomensanalista2024.txt');
const KIRJAIMET = /^[A-ZÅÄÖ]+$/;

function lataaSanasto() {
  const rivit = readFileSync(SANALISTA, 'utf8').split('\n').slice(1);
  const ryhmat = new Map(); // lajitellut kirjaimet -> [sana, ...]
  for (const rivi of rivit) {
    const hakusana = rivi.split('\t')[0];
    if (!hakusana) continue;
    // Yhdyssanat väliviivalla, lyhenteet ja numerot alkuiset pois; erisnimet
    // tunnistaa isosta alkukirjaimesta.
    if (hakusana[0] !== hakusana[0].toLowerCase()) continue;
    const sana = hakusana.toUpperCase();
    if (!KIRJAIMET.test(sana)) continue;
    const avain = avaimeksi(sana);
    const lista = ryhmat.get(avain);
    if (lista) { if (!lista.includes(sana)) lista.push(sana); }
    else ryhmat.set(avain, [sana]);
  }
  return ryhmat;
}

const avaimeksi = (sana) => [...sana].sort().join('');

const AAKKOSET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'];

// Kaikki sanat jotka syntyvät lisäämällä yksi kirjain.
function kasvatukset(sana, ryhmat) {
  const tulos = [];
  for (const kirjain of AAKKOSET) {
    for (const ehdokas of ryhmat.get(avaimeksi(sana + kirjain)) ?? []) {
      tulos.push([kirjain, ehdokas]);
    }
  }
  return tulos;
}

// Kaikki avaimet jotka syntyvät poistamalla yksi kirjain.
function edeltajat(avain) {
  const tulos = new Set();
  for (let i = 0; i < avain.length; i++) {
    tulos.add(avain.slice(0, i) + avain.slice(i + 1));
  }
  return [...tulos];
}

// Palauttaa kaikki ketjut avaimesta alaspäin pituuteen `lyhin`. Muistiinpano
// pitää haun nopeana myös pitkillä sanoilla.
function ketjut(avain, lyhin, ryhmat, muisti = new Map()) {
  if (muisti.has(avain)) return muisti.get(avain);
  const sanat = ryhmat.get(avain) ?? [];
  let tulos;
  if (sanat.length === 0) {
    tulos = [];
  } else if (avain.length === lyhin) {
    tulos = sanat.map((sana) => [sana]);
  } else {
    tulos = [];
    for (const edellinen of edeltajat(avain)) {
      for (const hanta of ketjut(edellinen, lyhin, ryhmat, muisti)) {
        for (const sana of sanat) tulos.push([...hanta, sana]);
      }
    }
  }
  muisti.set(avain, tulos);
  return tulos;
}

// Pisin pituus johon sanasta pääsee alaspäin — kertoo millä rivillä ketju katkeaa.
function pisinLasku(avain, ryhmat, muisti = new Map()) {
  if (muisti.has(avain)) return muisti.get(avain);
  let paras = avain.length;
  for (const edellinen of edeltajat(avain)) {
    if (!ryhmat.has(edellinen)) continue;
    paras = Math.min(paras, pisinLasku(edellinen, ryhmat, muisti));
  }
  muisti.set(avain, paras);
  return paras;
}

// Ketju valmiina data/chains-muotoon. Vaihtoehtoiset kirjoitusasut haetaan
// sanalistasta: jokainen muu hakusana samoilla kirjaimilla kelpaa rivillä, ja
// ilman niitä peli hylkäisi pelaajan oikean sanan.
function tulostaKetju(sanat, ryhmat) {
  const vaihtoehdot = {};
  // Ensimmäinen sana näytetään pelin alussa valmiina, joten sille ei voi
  // kirjoittaa mitään. Viimeinen rivi on ketjun teemasana, joka halutaan
  // löytää juuri sellaisenaan — kummallekaan ei siis ehdoteta vaihtoehtoja.
  for (let i = 1; i < sanat.length - 1; i++) {
    const edellinen = avaimeksi(sanat[i - 1]);
    const seuraava = avaimeksi(sanat[i + 1]);
    // Rivin kelvollinen kirjainjoukko on edellinen + yksi kirjain. Jos rivejä
    // on vielä jäljellä, siitä pitää lisäksi syntyä seuraava rivi — muuten
    // haaran valinnut pelaaja jäisi jumiin.
    const avaimet = edeltajat(seuraava).filter((k) => sisaltyy(edellinen, k));
    const muut = [...new Set(avaimet.flatMap((k) => ryhmat.get(k) ?? []))]
      .filter((s) => s !== sanat[i]);
    if (muut.length > 0) vaihtoehdot[sanat[i]] = muut;
  }
  console.log(JSON.stringify({ words: sanat, alternatives: vaihtoehdot }, null, 2));
}

// Onko `pieni` osajoukko `isosta` (kumpikin lajiteltu kirjainjono)?
const sisaltyy = (pieni, iso) => {
  let jaannos = iso;
  for (const k of pieni) {
    const i = jaannos.indexOf(k);
    if (i < 0) return false;
    jaannos = jaannos.slice(0, i) + jaannos.slice(i + 1);
  }
  return true;
};

// Avaa sanan kirjainvaraston: mitkä sanat siitä ylipäätään syntyvät riveittäin,
// ja kuinka pitkälle ketjut niillä pääsevät. Tyhjä rivi on se kohta jossa juuri
// katkeaa — siitä ei pääse yli, vaikka ylempänä olisi sanoja.
function selitaKaatuminen(sana, ryhmat) {
  const avain = avaimeksi(sana);
  const kirjaimet = [...avain];

  const osajoukot = new Set();
  for (let maski = 0; maski < (1 << kirjaimet.length); maski++) {
    let osa = '';
    for (let i = 0; i < kirjaimet.length; i++) if (maski & (1 << i)) osa += kirjaimet[i];
    if (osa.length >= 3) osajoukot.add(avaimeksi(osa));
  }

  const riveittain = new Map();
  for (const osa of osajoukot) {
    const sanat = osa === avain ? [sana] : ryhmat.get(osa) ?? [];
    if (sanat.length === 0) continue;
    if (!riveittain.has(osa.length)) riveittain.set(osa.length, []);
    riveittain.get(osa.length).push(...sanat);
  }

  console.log('  Sanat jotka näistä kirjaimista syntyvät:');
  let aukko = null;
  for (let pituus = 3; pituus <= avain.length; pituus++) {
    const sanat = riveittain.get(pituus);
    console.log(`    ${pituus} kirjainta:  ${sanat ? [...new Set(sanat)].join(', ') : '— ei yhtään sanaa —'}`);
    if (!sanat && aukko === null) aukko = pituus;
  }

  const ketjut = [];
  for (const kolmen of new Set(riveittain.get(3) ?? [])) {
    ketjut.push(...ketjutAlkaen(kolmen, osajoukot, ryhmat, avain, sana));
  }
  const pisin = Math.max(0, ...ketjut.map((k) => k[k.length - 1].length));
  const parhaat = [...new Set(ketjut.filter((k) => k[k.length - 1].length === pisin).map((k) => k.join(' → ')))];
  console.log(`
  Pisimmälle pääsevät ketjut (${pisin} kirjainta):`);
  for (const ketju of parhaat.slice(0, 8)) console.log(`    ${ketju}`);
  if (parhaat.length > 8) console.log(`    ... ja ${parhaat.length - 8} muuta yhtä pitkää`);
  if (aukko !== null) {
    console.log(`
  Ketju katkeaa ${aukko} kirjaimeen: siltä riviltä ei ole yhtään sanaa,`);
    console.log('  joten ylempiä rivejä ei voi saavuttaa vaikka niillä olisi sanoja.');
  }
}

// Kaikki ketjut jotka lähtevät `alku`-sanasta ylöspäin, kunnes eivät enää kasva.
function ketjutAlkaen(alku, osajoukot, ryhmat, avain, huippu) {
  const tulos = [];
  (function kasva(polku) {
    const nykyinen = avaimeksi(polku[polku.length - 1]);
    const jatkot = [...osajoukot]
      .filter((osa) => osa.length === nykyinen.length + 1 && sisaltyy(nykyinen, osa))
      .flatMap((osa) => (osa === avain ? [huippu] : ryhmat.get(osa) ?? []));
    if (jatkot.length === 0) tulos.push(polku);
    else for (const jatko of jatkot) kasva([...polku, jatko]);
  })([alku]);
  return tulos;
}

function main() {
  const argv = process.argv.slice(2);
  let lyhin = 3;
  let naytteita = 5;
  let kaikki = false;
  let sisaltaa = null;
  let kasvata = false;
  let ketju = null;
  let miksi = false;
  let lisattavat = [];
  let keksitty = false;
  const sanat = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--lyhin') lyhin = Number(argv[++i]);
    else if (argv[i] === '--naytteita') naytteita = Number(argv[++i]);
    else if (argv[i] === '--kaikki') kaikki = true;
    else if (argv[i] === '--sisaltaa') sisaltaa = argv[++i].toUpperCase();
    else if (argv[i] === '--kasvata') kasvata = true;
    else if (argv[i] === '--miksi') miksi = true;
    else if (argv[i] === '--lisaa') lisattavat = argv[++i].toUpperCase().split(/[,\s]+/);
    else if (argv[i] === '--ketju') ketju = argv[++i].toUpperCase().split(/\s+/);
    else if (argv[i] === '--keksitty') keksitty = true;
    else sanat.push(argv[i].toUpperCase());
  }
  if (ketju) {
    tulostaKetju(ketju, lataaSanasto());
    return;
  }
  if (sanat.length === 0) {
    console.error('Anna vähintään yksi sana, esim: node tools/juuri.mjs NAIMATON');
    process.exit(1);
  }

  const ryhmat = lataaSanasto();
  // Sanalistassa on vain perusmuodot. Taivutusmuodon saa mukaan tätä kautta,
  // jolloin siitä näkee heti avautuuko sen varassa uusia ketjuja.
  for (const lisatty of lisattavat) {
    const kohta = ryhmat.get(avaimeksi(lisatty));
    if (kohta) { if (!kohta.includes(lisatty)) kohta.push(lisatty); }
    else ryhmat.set(avaimeksi(lisatty), [lisatty]);
  }
  const laskuMuisti = new Map();

  for (const sana of sanat) {
    const avain = avaimeksi(sana);
    console.log(`\n${sana} (${sana.length} kirjainta)`);
    if (miksi) {
      selitaKaatuminen(sana, ryhmat);
      continue;
    }
    if (kasvata) {
      const kasvut = kasvatukset(sana, ryhmat);
      if (kasvut.length === 0) console.log('  ei kasva mihinkään sanaan');
      else for (const [kirjain, ehdokas] of kasvut) console.log(`  +${kirjain} → ${ehdokas}`);
      continue;
    }
    // Sanalistassa on vain perusmuodot, joten taivutusmuoto karsiutuu tässä.
    if (!keksitty && !ryhmat.get(avain)?.includes(sana)) {
      const muut = (ryhmat.get(avain) ?? []).filter((s) => s !== sana);
      console.log('  ei ole sanalistan hakusana' + (muut.length ? ` (samoilla kirjaimilla: ${muut.join(', ')})` : ''));
      continue;
    }
    let loydetyt;
    if (keksitty && !ryhmat.get(avain)?.includes(sana)) {
      // Vain huippu saa olla keksitty — kaikki sen alla olevat rivit ovat oikeita sanoja.
      loydetyt = edeltajat(avain).flatMap((alempi) =>
        ketjut(alempi, lyhin, ryhmat).map((k) => [...k, sana]));
    } else {
      loydetyt = ketjut(avain, lyhin, ryhmat).filter((k) => k[k.length - 1] === sana);
    }
    if (sisaltaa) loydetyt = loydetyt.filter((k) => k.includes(sisaltaa));
    if (loydetyt.length === 0) {
      if (sisaltaa) { console.log(`  ei ketjua jossa olisi ${sisaltaa}`); continue; }
      const pohja = pisinLasku(avain, ryhmat, laskuMuisti);
      console.log(`  ei juurta — ketju katkeaa ${pohja} kirjaimeen`);
      continue;
    }
    console.log(`  ${loydetyt.length} ketjua:`);
    const naytettavat = kaikki ? loydetyt : loydetyt.slice(0, naytteita);
    for (const ketju of naytettavat) console.log(`    ${ketju.join(' → ')}`);
    if (naytettavat.length < loydetyt.length) {
      console.log(`    ... ja ${loydetyt.length - naytettavat.length} muuta (--kaikki näyttää kaikki)`);
    }
  }
}

main();
