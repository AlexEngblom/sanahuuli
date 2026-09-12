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
- Pelaaja muodostaa seuraavan sanan klikattavilla kirjainlaatoilla (edellisen sanan kirjaimet + poolin kirjaimet) ja/tai fyysisellä näppäimistöllä.
- Sanan lähettäminen:
  - Oikea seuraava sana tai sen anagrammi → etene seuraavalle riville.
  - Kaikki muu → lempeä "ei etene" -palaute; yrittäminen on vapaata (ei elämiä, ei pisteitä).
- **Lopeta**-nappi: paljastaa ketjun loput sanat.

**Voitto:**
- Viimeisen sanan muodostaminen näyttää voittoruudun ja koko valmiin ketjun.

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
