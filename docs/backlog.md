~~1. Lopeta-nappi~~ — TEHTY: kysyy jatketaanko myöhemmin, ei paljasta ketjua, palaa listaukseen.

~~2. Alarivin 4 nappia pitäisi kaikki mahtua samalle riville.~~ — TEHTY: Alarivin napit yhdelle riville — ✕ ja ↻ pyöreiksi ikoninapeiksi, clamp()-välit.

~~3. Ei käytetä Media queryä jos ei ole pakko. Tämä taitaa olla wanhahtava tapa. Mieluummin responsiivinen toteutus.~~ — TEHTY: Media queryt poistettu — pyramidi mittaa itsensä container query -yksiköillä ja ketjun pisimmästä sanasta.

~~4. Suurennetaan pelialueen laatikoita hieman.~~ — TEHTY: Pelilaatikot 44px → 52px (katto), kirjainsuhde 0.62 kuten HS:llä.

~~5. Pienennetään kirjainvalikon laatikoita hieman.~~ — TEHTY: Kirjainpankin laatat 56px → 48px, kirjainkoko ennallaan.

~~6. Pidetään kirjainvalikon järjestys samana vaikka päivittäisin sivua.~~ — PERUTTU: toteutettiin (järjestys localStorageen etenemisen mukana), mutta todettiin ettei sekoittuminen päivityksessä ole käytännössä ongelma. Muutos peruttu, ei kannata tehdä uudelleen.

~~7. Koodissa on suomea ja englantia sekaisin ainakin kommenteissa. Pidetään englantina.~~ — TEHTY: kommentit englanniksi, HS-viittaukset pois koodista. Dokumentit pysyvät suomeksi ja niiden HS-maininnat jätettiin tarkoituksella.

~~8. Pelilistaus sivun ei ehkä pitäisi olla keskittynyt alas vaan saisi viedä koko sivun.~~ — TEHTY: main-asettelu eriytetty sivukohtaiseksi; listaus alkaa ylhäältä ja täyttää sivun, peli pysyy alareunassa.

Matkan varrella tehtyä, ei alun perin backlogilla:
- Ohjeteksti "Käytä kaikki edellisen sanan kirjaimet ja yksi uusi" uuden huulen alussa.
- Viestikenttä ei tyhjentynyt lainkaan — vanha virheviesti jäi ruudulle. Korjattu.
- Vihje-nappi piiloon pelin päätyttyä.
- Pelilaatikoiden kirjaimet olivat pystysuunnassa hieman ylhäällä: oma align-items: center kumosi napin natiivin keskityksen. Korjattu.