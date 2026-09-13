# Pelin säännöt — Sanahuuli

Säännöt perustuvat Helsingin Sanomien *Sanajuuri*-sanapeliin.

## Tavoite

Tavoitteesi on muodostaa sanoja, jotka kasvavat kirjaimella pidemmiksi joka rivillä.

- Näet pelin alussa ensimmäisen sanan ja kaikki käytettävissä olevat kirjaimet.
- Muodosta seuraava sana käyttämällä **kaikki edellisen sanan kirjaimet ja yksi uusi kirjain**.
- Peli jatkuu, kunnes saat muodostettua viimeisen sanan — tai kunnes painat *Lopeta* ja jätät huulen kesken.

## Sanojen muodostus

- Jos edellinen sana on ILO ja lisättävä kirjain on K, seuraava sana on OLKI tai anagrammi KILO.
- Kaikki sanat eivät kelpaa — **vain tietty kirjain vie eteenpäin** pelissä. Ketjussa on vain yksi oikea seuraava sana (tai sen anagrammi) per rivi.
- Sanoiksi eivät kelpaa (alkuperäispelissä): erisnimet, taivutetut sanat, yhdyssanat tai lyhenteet. Halventavat sanat on poistettu pelin sanastosta.

## Huomioita tämän toteutuksen rajauksista

- Pelissä **ei ole sanastotarkistusta** — oikeellisuus määrittyy pelkästään sanaketjun datan perusteella. Kaikki muut syötteet kuin ketjun seuraava sana (tai sen anagrammi) hylätään "ei etene" -vastauksella.
- Vertailu tehdään kirjainjoukkona: syötteen täytyy sisältää täsmälleen edellisen sanan kirjaimet plus yksi uusi kirjain. Oikean sanan anagrammit kelpaavat.
- Ääkkösten kanssa ei ole joustoa (a ≠ ä, o ≠ ö), kuten alkuperäispelissäkin.

## Pelin päättyminen

- **Voitto:** pelaaja muodostaa ketjun viimeisen sanan.
- **Lopetus:** *Lopeta*-nappi kysyy, jatkatko myöhemmin. Jos jatkat, eteneminen säilyy; jos et, se unohdetaan. Kumpikin vie takaisin huulilistaukseen — ketju jää sinulta näkemättä.
