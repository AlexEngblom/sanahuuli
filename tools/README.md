# Työkalut

Kehitysaikaisia apureita ketjujen tekemiseen. **Mitään täällä ei tarjoilla selaimelle** —
peli lataa vain `data/chains/`-hakemiston JSON-tiedostot.

## `juuri.mjs`

Etsii sanalle kaikki mahdolliset juuret: ketjut, joissa jokainen sana on edellinen
+ yksi uusi kirjain, järjestys vapaa.

```
node tools/juuri.mjs NAIMATON                 kaikki juuret, näyte tulostuksesta
node tools/juuri.mjs SULHANEN MORSIAN         monta sanaa kerralla
node tools/juuri.mjs --kaikki NAIMATON        koko lista, ei vain näytettä
node tools/juuri.mjs --sisaltaa AVOPARI AVIOPARI   vain ketjut joissa tämä sana
node tools/juuri.mjs --lyhin 4 MAISTELU       lopeta neljään kirjaimeen
```

Sanalistassa on vain perusmuodot. Kun jokin rivi kaipaa taivutusmuotoa, sen saa
mukaan `--lisaa`-valitsimella, jolloin näkee heti avautuuko sen varassa uusia
ketjuja:

```
node tools/juuri.mjs --keksitty --lisaa KADOTTI DIKTATOR
node tools/juuri.mjs --miksi MULKUTUS        mitkä sanat kirjaimista ylipäätään syntyvät
```

Jos sana ei ole sanalistan hakusana, työkalu sanoo sen suoraan — esim. NAURATUS ja
KRAPULAA eivät kelpaa, koska sanalistassa on vain perusmuodot. Se on tarkoituksellista:
Sanajuuri-tyylisessä pelissä taivutusmuodot ketjun rivinä ovat laiskoja.

## `nykysuomensanalista2024.txt`

Kotimaisten kielten keskuksen **Nykysuomen sanalista** (104 743 hakusanaa, TSV).
Lisenssi CC BY 4.0, tekijä Kotimaisten kielten keskus — https://kaino.kotus.fi/sanat/nykysuomi/

Sisältää vain perusmuodot, mikä sattuu olemaan täsmälleen se mitä ketjujen teossa
tarvitaan. Työkalu suodattaa pois isolla alkukirjaimella alkavat (erisnimet, lyhenteet)
ja kaiken mikä ei ole pelkkiä kirjaimia (yhdysviivat, numerot).

Vaihtoehdot eivät ole pelkkiä anagrammeja: rivillä kelpaa mikä tahansa sana
joka on edellinen rivi + yksi kirjain ja josta seuraava rivi yhä syntyy. PARVI
on RAVI + P ja ARVIO on RAVI + O, ja POVARI seuraa kummasta tahansa. Ensimmäistä
riviä (näytetään valmiina) ja viimeistä (ketjun teemasana) ei ehdoteta.

Generaattori poimii kaiken samakirjaimisen Kotuksen listalta eikä osaa arvioida
tunteeko sanaa kukaan, joten ehdotukset kannattaa käydä läpi käsin.

## `tarkista-ketjut.mjs`

Ajaa kaikki `data/chains/`-ketjut pelin oman `createGame`-funktion läpi, eli sama
validointi jonka peli tekee latautuessaan. Kannattaa ajaa aina uuden ketjun jälkeen.

```
node tools/tarkista-ketjut.mjs
```
