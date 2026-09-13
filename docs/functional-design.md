# Toiminnallinen suunnittelu — Sanahuuli

Yksinkertainen sanapeli polttariviikonloppuun: pelaajat muodostavat sanoja, jotka kasvavat kirjaimella per rivi, seuraten kiinteää kuratoitua ketjua ("juurta").

## Sivut

### 1. Ketjulistaus (`index.html`)

- Listaa kaikki saatavilla olevat ketjut tiedostosta `data/chains/manifest.json` (nimi + kuvaus).
- Jokainen ketju linkittää pelisivulle: `peli.html?huuli=<id>`.
- Uudet ketjut lisätään committaamalla datatiedostoja repoon — ei luontia sovelluksessa (toistaiseksi).

### 2. Peli (`peli.html?huuli=<id>`)

**Latautuessa:**
- Lukee ketjun id:n query stringistä ja lataa ketjun JSON:n.
- Näyttää ensimmäisen sanan ja koko kirjainpoolin (kaikki ketjun aikana lisättävät kirjaimet).
- Näyttää laudan yläpuolella ohjeen "Käytä kaikki edellisen sanan kirjaimet ja yksi uusi". Ohje katoaa ensimmäisestä napautuksesta, eikä sitä näytetä kesken jäänyttä peliä jatkettaessa.
- Puuttuva/tuntematon ketju-id → ystävällinen virheviesti ja linkki takaisin listaukseen.

**Pelatessa:**
- Ketju näytetään pyramidina: täydennetyt rivit ylhäällä, nykyinen rivi aktiivisena, tulevat rivit tyhjinä laatikoina.
- Pelaaja muodostaa seuraavan sanan klikkaamalla **kirjainpankin** laattoja (nykyisen sanan kirjaimet + jäljellä olevat uudet kirjaimet) ja/tai fyysisellä näppäimistöllä. Nykyisen sanan kirjaimet näytetään tummina laattoina ja vielä käyttämättömät uudet kirjaimet kirkkaina — näin pelaaja hahmottaa, mikä kirjain vie eteenpäin.
- Laatat menevät nykyiselle riville järjestyksessä. Kirjaimen voi poistaa kolmella tavalla: klikkaamalla sitä rivin laatikosta, klikkaamalla jo käytettyä laattaa uudelleen kirjainpankissa, tai Backspacella (poistaa viimeisimmän). **✕** tyhjentää rivin, **↻** sekoittaa pankin.
- Sanan lähettäminen: **sana lähtee automaattisesti, kun rivi täyttyy** — erillistä lähetysnappia ei ole. Enter lähettää myös vajaan rivin.
  - Ketjun seuraava sana kirjaimelleen, tai ketjudataan kuratoitu vaihtoehtoinen kirjoitusasu → etene seuraavalle riville. Oikeat kirjaimet väärässä järjestyksessä eivät riitä.
  - Ratkaistulle riville jää se kirjoitusasu jonka pelaaja käytti, ei ketjun kanoninen sana. Sivun päivitys palauttaa kanonisen sanan, koska kirjoitusasua ei tallenneta.
  - Kaikki muu → lempeä "ei etene" -palaute; yrittäminen on vapaata (ei elämiä, ei pisteitä). Palaute erottelee kaksi tapausta: edellisen sanan kirjaimia jäi käyttämättä (kirjainten lukumäärät huomioiden), vai eikö syöte muuten etene. Peli ei kerro oliko kirjainvalinta oikea — se paljastaisi puolet vastauksesta.
- **Lopeta**-nappi: kysyy, haluaako pelaaja palata jatkamaan myöhemmin. Kyllä säilyttää etenemisen, ei tyhjentää sen — molemmissa tapauksissa pelaaja palaa ketjulistaukseen. Ketjua ei koskaan paljasteta.
- **Vihje**-nappi on käyttöliittymässä, mutta se ei vielä anna oikeaa vihjettä — se tulostaa vitsirivin. Varsinainen vihjetoiminto on yhä pois scopesta.
- **ⓘ-nappi** yläkulmassa avaa ohjeet modaalina.

**Voitto:**
- Viimeisen sanan muodostaminen paljastaa koko ketjun, näyttää onnitteluviestin ja korvaa pelinapit **Pelaa uudelleen** -napilla. Erillistä voittomodaalia ei ole.

## Visuaalinen suunta

- Tumma teema ja HS:n Sanajuurta mukaileva asettelu: sanapyramidi keskellä, kirjainpankki alla, toiminnot pohjassa, ohjeet ⓘ-napin takana.
- UX tarkennetaan myöhemmin pelikokemuksen perusteella.

## Tilan säilyvyys

- Pelin eteneminen tallentuu automaattisesti localStorageen — sivun saa päivittää tai sulkea kesken pelin.
- Voiton jälkeen voi aloittaa alusta ("Pelaa uudelleen").

## Interaktiovaatimukset

- **Mobiilifirst:** isot kosketuskohteet, pelattavissa yhdellä kädellä puhelimella.
- **Näppäimistötuki** pöytäkonepelaamiseen.
- **Ääkköset** (ä, ö) ovat täysivaltaisia kirjaimia — laattojen ja näppäimistösyötteen on käsiteltävä ne.

## Datavetoisuus

- Kaikki pelisisältö elää ketjujen JSON-tiedostoissa; sovelluksessa ei ole yhtään kovakoodattua sanaa.
- Formaatti on eteenpäin yhteensopiva: valinnaiset kentät (esim. per-sana vihjeet, teemoittelu) voidaan lisätä myöhemmin rikkomatta olemassa olevia ketjuja.

## Pois scopesta (toistaiseksi)

- Mielivaltaisten sanojen sanastovalidointi — vain ketjun seuraava sana vie eteenpäin.
- Oikeat vihjeet, pisteet, ajastin, vaikeustasot. (Vihje-nappi on olemassa, mutta vain vitsinä.)
- Kesken olevan rivin säilyttäminen sivun päivityksessä — eteneminen säilyy, mutta jo napautetut kirjaimet eivät.
- Käyttäjien luomat ketjut käyttöliittymässä, jakomekaniikat pelkkien linkkien lisäksi.
