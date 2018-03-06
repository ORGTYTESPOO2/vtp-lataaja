const config = require('../config/config.json')
const logger = require('./logger');
const argv = require('yargs').argv

function isURL(str) {
  const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name and extension
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?' + // port
    '(\\/[-a-z\\d%@_.~+&:]*)*' + // path
    '(\\?[;&a-z\\d%@_.,~+&:=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return pattern.test(str);
}

async function readConfig() {
  if (argv.api && !argv.testapi) {
    logger.info('Työkalu on valittu käyttämään VTP:n tuotantopalvelimen rajapintaa.');
    logger.debug('Luettu konfiguraatio: ');
    logger.debug(config.api);
    return config.api
  } else if (argv.testapi) {
    logger.info('Työkalu on valittu käyttämään VTP:n testipalvelimen rajapintaa');
    logger.debug('Luettu konfiguraatio:');
    logger.debug(config.testapi);
    return config.testapi
  } else {
    logger.error('Työkalu tarvitsee valitsimen --api tai --testapi käytettävän rajapinnan määritykseen');
    process.exit();
  }
}

module.exports = {
  isURL,
  readConfig
};