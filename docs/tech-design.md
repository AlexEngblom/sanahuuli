# Tekninen suunnittelu — Sanahuuli

## Rajoitukset

- Hostataan **GitHub Pagesissa** — täysin staattinen, ei backendia, ei tunnistautumista, ei palvelinpuolen persistointia.
- Toimittava mobiiliselaimilla (ensisijainen laite polttariviikonloppuna).
- Suorien linkkien (esim. `peli.html?juuri=<id>`) on toimittava hostattuna (query stringit ovat turvallisia staattisessa hostauksessa).

## Teknologiavalinnat

| Päätös | Valinta | Perustelu |
|---|---|---|
| Teknologia | Vanilla HTML / CSS / JS, natiivit ES-moduulit | Ei build-vaihetta, ei riippuvuuksia, triviaali ylläpito ja julkaisu |
| Testaus | Noden sisäänrakennettu test runner (`node --test`) | Ei riippuvuuksien asennusta, toimii CI:ssä suoraan |
| CI/CD | GitHub Actions → deploy GitHub Pagesiin | Testit porttaavat deployn; push `main`-haaraan julkaisee |
| Data | Staattiset JSON-tiedostot repossa | Ketjut ("juuret") kuratoidaan ja commitoidaan; ei generaattoria, ei persistointia |

## Repon rakenne

```
index.html                  # Ketjulistaus (lukee data/chains/manifest.json)
peli.html                   # Pelisivu (lukee ?juuri=<id>, lataa data/chains/<id>.json)
css/
  style.css                 # Mobiilifirst-tyylit
js/
  game.js                   # Puhdas pelilogiikka — ei DOMia. Kirjainpankki, anagrammitarkistus, siirtovalidointi, pelitila
  chains.js                 # Ketjujen haku ja normalisointi (uppercase, ääkköset säilyvät)
  storage.js                # Pelitilan tallennus localStorageen (eteneminen ei häviä sivun päivityksessä)
  ui.js                     # DOM-renderöinti (pyramidi, kirjainpankki, palaute, voittoruutu)
  main.js                   # Tapahtumien kytkentä, sivun käynnistys
data/
  chains/
    manifest.json           # [{ id, name, description }]
    <id>.json               # { id, name, words: [...], valinnainen per-sana metadata tulevaisuutta varten }
test/
  game.test.js              # Puhtaan logiikan yksikkötestit (node:test)
.github/
  workflows/
    pages.yml               # node --test + GitHub Pages -deploy pushista mainiin
```

## Dataformaatti

Ketjutiedosto (`data/chains/<id>.json`):

```json
{
  "id": "polttarit",
  "name": "Polttarit",
  "words": ["ILO", "OLKI", "KOLAUS"],
  "hints": null
}
```

- `words` — järjestetty ketju; jokaisen sanan on oltava muodostettavissa edellisen sanan kirjaimista plus täsmälleen yksi uusi kirjain. Testit varmentavat tämän.
- Per-sana metadata (esim. vihjeet) on varattu tulevaa laajennusta varten — formaatin täytyy sietää ylimääräisiä kenttiä.

## Pelilogiikan ydin (`js/game.js`)

- Latauksen yhteydessä "oikea" lisäkirjain per siirtymä johdetaan ketjusta (seuraavan sanan kirjaimet miinus edellisen sanan kirjaimet). Pelaajalle näytettävä **kirjainpankki** on nykyisen sanan kirjaimet + jäljellä olevat lisäkirjaimet — pankin koko pysyy vakiona koko pelin ajan (HS:n Sanajuuren tyyliin).
- **Siirron validointi:** syötteen täytyy koostua täsmälleen edellisen sanan kirjaimista plus yhdestä uudesta kirjaimesta. Eteneminen edellyttää, että syöte vastaa ketjun seuraavaa sanaa **anagrammina** (sama kirjainjoukko, ei välttämättä sama merkkijono).
- **Pelitila:** nykyinen indeksi, tila (`playing` / `won` / `given-up`). Lopetus paljastaa ketjun loput sanat.
- Kaikki logiikka on puhdasta ja DOM-vapaata, jotta se on yksikkötestattavissa Nodessa.

## Tilan säilyvyys (localStorage)

- Pelin eteneminen tallennetaan selaimen localStorageen avaimella `sanahuuli:progress:<chainId>` (`{ index, status }`).
- Tila palautetaan latautuessa, jotta peli ei häviä vahingossa (esim. sivun päivitys).
- "Pelaa uudelleen" tyhjentää tallennetun tilan. Ei synkronointia laitteiden välillä (ei backendia).

## Testaus

- `node --test` `test/`-hakemistoon, ajetaan lokaalisti ja CI:ssä.
- Tapaukset: normaalitapaus, väärä lisäkirjain, anagrammien hyväksyntä, ääkkösten käsittely, viimeinen sana → voitto, ketjudatan eheys (jokainen askel +1 kirjain, anagrammi-edellisestä-plus-yksi -invariantti).

## Julkaisu

- Push `main`-haaraan → Actions ajaa testit → onnistuessaan deployaa staattisen sivuston Pagesiin (`actions/deploy-pages`).
- Pages-lähde: GitHub Actions.

## Nimenomaisesti pois scopesta

- Sanasto- / oikolukutarkistus
- Sanaketjujen generaattori
- Käyttäjien luomat ketjut (vaatii persistointia — shelvattu; mahdollisia tulevia vaihtoehtoja: JSON leikepöydälle/lataukseen PR:ää varten, tai URL-koodatut ketjut)
- Vihjeet, pisteet, ajastin, tunnistautuminen
