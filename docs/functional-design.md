# Toiminnallinen suunnittelu — Sanahuuli

Yksinkertainen sanapeli polttariviikonloppuun: pelaajat muodostavat sanoja, jotka kasvavat kirjaimella per rivi, seuraten kiinteää kuratoitua ketjua ("juurta").

## Sivut

### 1. Ketjulistaus (`index.html`)

- Listaa kaikki saatavilla olevat ketjut tiedostosta `data/chains/manifest.json` (nimi + kuvaus).
- Jokainen ketju linkittää pelisivulle: `peli.html?juuri=<id>`.
- Uudet ketjut lisätään committaamalla datatiedostoja repoon — ei luontia sovelluksessa (toistaiseksi).

### 2. Peli (`peli.html?juuri=<id>`)

**Latautuessa:**
- Lukee ketjun id:n query stringistä ja lataa ketjun JSON:n.
- Näyttää ensimmäisen sanan ja koko kirjainpoolin (kaikki ketjun aikana lisättävät kirjaimet).
- Puuttuva/tuntematon ketju-id → ystävällinen virheviesti ja linkki takaisin listaukseen.

**Pelatessa:**
- Ketju näytetään pyramidina: täydennetyt rivit ylhäällä, nykyinen rivi aktiivisena, tulevat rivit tyhjinä laatikoina.
- Pelaaja muodostaa seuraavan sanan klikkaamalla **kirjainpankin** laattoja (nykyisen sanan kirjaimet + jäljellä olevat uudet kirjaimet) ja/tai fyysisellä näppäimistöllä.
- Laatat menevät nykyiselle riville järjestyksessä; rivin laatikkoa klikkaamalla tai Backspacella kirjaimen voi poistaa. **✕** tyhjentää rivin, **↻** sekoittaa pankin.
- Sanan lähettäminen:
  - Oikea seuraava sana tai sen anagrammi → etene seuraavalle riville.
  - Kaikki muu → lempeä "ei etene" -palaute; yrittäminen on vapaata (ei elämiä, ei pisteitä).
- **Lopeta**-nappi: paljastaa ketjun loput sanat.
- **ⓘ-nappi** yläkulmassa avaa ohjeet modaalina.

**Voitto:**
- Viimeisen sanan muodostaminen näyttää voittoruudun ja koko valmiin ketjun.

## Visuaalinen suunta

- Tumma teema ja HS:n Sanajuurta mukaileva asettelu: sanapyramidi keskellä, kirjainpankki alla, toiminnot pohjassa, ohjeet ⓘ-napin takana.
- UX tarkennetaan myöhemmin pelikokemuksen perusteella.

## Tilan säilyvyys

- Pelin eteneminen tallentuu automaattisesti localStorageen — sivun saa päivittää tai sulkea kesken pelin.
- Voiton tai lopetuksen jälkeen voi aloittaa alusta ("Pelaa uudelleen").

## Interaktiovaatimukset

- **Mobiilifirst:** isot kosketuskohteet, pelattavissa yhdellä kädellä puhelimella.
- **Näppäimistötuki** pöytäkonepelaamiseen.
- **Ääkköset** (ä, ö) ovat täysivaltaisia kirjaimia — laattojen ja näppäimistösyötteen on käsiteltävä ne.

## Datavetoisuus

- Kaikki pelisisältö elää ketjujen JSON-tiedostoissa; sovelluksessa ei ole yhtään kovakoodattua sanaa.
- Formaatti on eteenpäin yhteensopiva: valinnaiset kentät (esim. per-sana vihjeet, teemoittelu) voidaan lisätä myöhemmin rikkomatta olemassa olevia ketjuja.

## Pois scopesta (toistaiseksi)

- Mielivaltaisten sanojen sanastovalidointi — vain ketjun seuraava sana vie eteenpäin.
- Vihjeet, pisteet, ajastin, vaikeustasot.
- Käyttäjien luomat ketjut käyttöliittymässä, jakomekaniikat pelkkien linkkien lisäksi.
