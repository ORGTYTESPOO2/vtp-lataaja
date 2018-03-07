# Lataustyökalu viestintäviraston Verkkotietopiste -palvelun rajapintaan

Lue rajapintaan liittyvät ohjeet Verkkotietopisteen verkkosivulta: https://verkkotietopiste.fi/

## Ominaisuudet
1. Työkalu lukee GML-tiedostosta tai WFS-rajapinnasta rakentamishankkeet ja lähettää ne verkkotietopisteeseen.
2. Se tarkistaa ovatko tiedot päivittyneet ja lähettää vain muuttuneet tiedot.
3.  Työkalussa on kuiva-ajotoiminto, jolla pystyy testaamaan, että aineisto on kunnossa ennen kuin sen ottaa tuotantokäyttöön.
4. Se lukee verkkotietopisteestä rajatulla alueella olevat muiden rakentamishankkeet ja tallentaa ne GML-tiedostoon.

### Edellytykset
1. Lataa itsellesi node.js:n LTS-versio 8.9.1 osoitteesta https://nodejs.org/en/ . Komennon `node -v` pitäisi nyt näyttää konsolissa oikea versio. 
2. Lataa ogr2ogr -komentorivityökalu kera GDALin osoitteesta https://trac.osgeo.org/gdal/wiki/DownloadingGdalBinaries . `ogr2ogr --version` vastannee nyt myös oikealla versiolla. Projekti on tehty ogr2ogrilla joka viittaa GDALin versioon 1.11.5.
3. Aja Noden mukana tulleen paketinhallintaohjelman komento `npm install` työkalun juurikansiosta, projektin sisäisten riippuvuuksien asennukseen.
4. Pääkäyttäjän tulee olla tunnistautunut verkkotietopisteeseen.

### Konfigurointi
Config-kansiossa olevaan config.json-tiedostoon pitää määritellä organisaatiolle sopivat asetukset.

### Käyttö
Työkalu ajetaan komennolla `node app.js` työkalun juurikansiosta. Käytön tarkempi määrittely tehdään seuraavilla valitsimilla:
1. `--api` // `--testapi`: pakollinen määrittely (joko-tai) sille, ottaako työkalu konfiguraatioidensa arvot Verkkotietopisteen testi- vai tuotantopalvelimelle osoitettuna
2. `--deleteall`: Työkalu poistaa kaikki Verkkotietopisteen rajapinnasta löytyvät verkot, muttei lisää mitään uutta.
3. `--dryrun`: Kuiva-ajovalitsin, jolla työkalu selvittää, millaisia muutoksia ajaisi kohderajapintaan, mutta ei aja sinne mitään muutoksia.
4. `--search`: Hakuvalitsin, joka lataa konfiguraation mukaisen hakualueensa määrittelyksi. Hakutulokset kirjoitetaan kansioon ./gml/ päivättynä ja tuotanto- ja testipalvelimen mukaan eriteltynä. Mikäli saman päivän aikana tehdään useampia hakuja, uudet tulosGML:t nimetään etenevässä sekvenssissä {pohjatiedosto}.{1:stä alkava numero}. Ei huomioi valitsinta `--dryrun`.  

Esimerkiksi siis `node app.js --testapi --dryrun` kertoo sinulle, millaisia muutoksia lähteenä käytetystä GML:stä olisi testipalvelimen rajapintaan tapahtumassa, jonka jälkeen `node app.js --testapi` ajaa samaiset muutokset. 

Projektin info ja error -tasojen lokitus ilmestyy työkalua ajettaessa konsoliin. Näiden lisäksi debug-tason yksityiskohtaisempi lokitieto löytyy kansiosta ./log/, johon lokitiedostot ilmestyvät tiedostoon {vuosi}-{kuukausi}-{päivä}-{tiedostonimi_konfiguraatiossa}.log.

#### Muuta
Työkalun on teettänyt ja sitä käyttää Espoon kaupungin kaupunkitekniikankeskus.
