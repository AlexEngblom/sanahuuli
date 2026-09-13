# Tekninen suunnittelu — Sanahuuli

## Rajoitukset

- Hostataan **GitHub Pagesissa** — täysin staattinen, ei backendia, ei tunnistautumista, ei palvelinpuolen persistointia.
- Toimittava mobiiliselaimilla (ensisijainen laite polttariviikonloppuna).
- Suorien linkkien (esim. `peli.html?huuli=<id>`) on toimittava hostattuna (query stringit ovat turvallisia staattisessa hostauksessa).

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
peli.html                   # Pelisivu (lukee ?huuli=<id>, lataa data/chains/<id>.json)
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
  "alternatives": { "OLKI": ["KILO"] },
  "hints": null
}
```

- `words` — järjestetty ketju; jokaisen sanan on oltava muodostettavissa edellisen sanan kirjaimista plus täsmälleen yksi uusi kirjain. Testit varmentavat tämän.
- Ketjun sanoiksi eivät alkuperäispelissä kelpaa erisnimet, taivutetut sanat, yhdyssanat eivätkä lyhenteet, ja halventavat sanat on jätetty pois. Tämä on kuratointiohje uutta ketjua lisättäessä — koodi ei valvo sitä, testit tarkistavat vain kirjainrakenteen.
- `alternatives` (valinnainen) — muut kirjoitusasut jotka kelpaavat ketjun sanan sijasta. Avaimena ketjun sana, arvona lista sen anagrammeja. Tämä korvaa sanastotarkistuksen: koska peli ei voi tietää mikä anagrammi on oikea suomen sana, tieto kuratoidaan dataan. Testit varmentavat että jokainen vaihtoehto on anagrammi siitä sanasta jonka alla se on, ja että sana kuuluu ketjuun.
- Per-sana metadata (esim. vihjeet) on varattu tulevaa laajennusta varten — formaatin täytyy sietää ylimääräisiä kenttiä.

## Pelilogiikan ydin (`js/game.js`)

- Latauksen yhteydessä "oikea" lisäkirjain per siirtymä johdetaan ketjusta (seuraavan sanan kirjaimet miinus edellisen sanan kirjaimet). Pelaajalle näytettävä **kirjainpankki** on nykyisen sanan kirjaimet + jäljellä olevat lisäkirjaimet — pankin koko pysyy vakiona koko pelin ajan (HS:n Sanajuuren tyyliin). Nykyisen sanan kirjaimet ja jäljellä olevat lisäkirjaimet renderöidään eri tyylein, jotta pelaaja näkee mikä kirjain vie eteenpäin.
- **Siirron validointi:** eteneminen edellyttää, että syöte on ketjun seuraava sana **kirjaimelleen** tai jokin sille kuratoitu `alternatives`-kirjoitusasu (`isAcceptedSpelling`). Pelkän anagrammin hyväksyminen oli bugi: ilman sanastoa peli ei erota sanaa KILO merkityksettömästä OLIKista, joten pelaaja pääsi koko ketjun läpi napauttelemalla kirjaimia missä tahansa järjestyksessä. `isAnagram` on yhä käytössä ketjudatan ja vaihtoehtojen validoinnissa sekä palauteviestin valinnassa.
- **Pelitila:** nykyinen indeksi, tila (`playing` / `won`). Lopetus ei ole pelitila vaan poistuminen: peli kysyy säilytetäänkö eteneminen ja palaa listaukseen.
- **Palaute hylätystä siirrosta:** `missingLetters()` vertaa edellisen sanan kirjaimia syötteeseen **lukumäärät huomioiden**, jotta "käytit vain toisen A:sta" tunnistetaan puuttuvaksi kirjaimeksi. Aiempi "sisältyykö kirjain" -tarkistus antoi toistuvilla kirjaimilla väärän viestin.
- Kaikki logiikka on puhdasta ja DOM-vapaata, jotta se on yksikkötestattavissa Nodessa.

## Tyylit ja asettelu (`css/style.css`)

Nämä kolme ratkaisua eivät ole ilmeisiä koodia lukemalla, ja kaksi ensimmäistä menee helposti rikki "siivottaessa".

- **Ei media queryjä, eikä niitä pidä lisätä takaisin.** Laudan oikea rajoite ei ole ruudun leveys vaan ketjun pisin sana — jota breakpoint ei voi tietää. Pyramidi on container query -konteksti (`container-type: inline-size`), ja laatikon koko lasketaan sen omasta leveydestä ja `--cols`-muuttujasta, jonka `ui.js` asettaa pisimmän sanan mukaan: `--box: min(52px, (100cqw − välit) / var(--cols))`. Koko on siis portaaton kaikilla leveyksillä, ja pidempi ketju kutistaa laatikoita sen sijaan että valuisi yli reunan. Kirjainpankki on mitoitettu samalla periaatteella.
- **`.box`-laatikoihin ei saa laittaa `display: flex`.** Pelkkiä isoja kirjaimia keskitettäessä riviboksi varaa tilaa ala-pidennyksille joita ei koskaan tule, jolloin kirjain jää liian ylös. `text-box: trim-both cap alphabetic` korjaa sen, mutta se vaikuttaa **vain block-containereihin** — `display: flex` kytkee sen hiljaisesti pois ilman virheilmoitusta. Sekä `.box` että `.tile` nojaavat siksi napin natiiviin keskitykseen.
- **Pystyasettelu on sivukohtainen.** `main` sisältää vain sivuille yhteisen osan; asemoinnin tekevät `body[data-page="game"]` ja `body[data-page="list"]`. Peli on alareunassa peukalon ulottuvilla, listaus alkaa ylhäältä ja täyttää sivun.

## Tilan säilyvyys (localStorage)

- Pelin eteneminen tallennetaan selaimen localStorageen avaimella `sanahuuli:progress:<chainId>` (`{ index, status, spellings }`).
- Tila palautetaan latautuessa, jotta peli ei häviä vahingossa (esim. sivun päivitys).
- "Pelaa uudelleen" tyhjentää tallennetun tilan. Ei synkronointia laitteiden välillä (ei backendia).

## Testaus

- `node --test` `test/`-hakemistoon, ajetaan lokaalisti ja CI:ssä.
- Tapaukset: normaalitapaus, väärä lisäkirjain, anagrammien hyväksyntä, ääkkösten käsittely, viimeinen sana → voitto, palautteen kirjaslaskenta (`missingLetters`), tallennetun etenemisen palautus ja rajaus, ketjudatan eheys (jokainen askel +1 kirjain, anagrammi-edellisestä-plus-yksi -invariantti).
- Tyylejä ei testaa mikään — CSS-muutokset on katsottava selaimessa molemmilta sivuilta.

## Julkaisu

- Push `main`-haaraan → Actions ajaa testit → onnistuessaan deployaa staattisen sivuston Pagesiin (`actions/deploy-pages`).
- Pages-lähde: GitHub Actions.

## Nimenomaisesti pois scopesta

- Sanasto- / oikolukutarkistus. Korvike on ketjudatan `alternatives`-kenttä.
- Sanaketjujen generaattori
- Käyttäjien luomat ketjut (vaatii persistointia — shelvattu; mahdollisia tulevia vaihtoehtoja: JSON leikepöydälle/lataukseen PR:ää varten, tai URL-koodatut ketjut)
- Oikeat vihjeet, pisteet, ajastin, tunnistautuminen. Käyttöliittymässä on Vihje-nappi, mutta se tulostaa vain vitsirivin.
- **Kirjainpankin järjestyksen säilyttäminen sivun päivityksessä.** Tämä toteutettiin kerran (järjestys localStorageen etenemisen mukana, `isValidTileOrder`) ja peruttiin tietoisesti: laattojen sekoittuminen päivityksessä ei osoittautunut ongelmaksi, eikä lisätty tila ollut sen arvoista. Älä tee uudelleen ilman uutta perustetta.
- Kesken olevan rivin säilyttäminen sivun päivityksessä.
