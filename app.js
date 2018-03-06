const { promisify } = require('util');
const logger = require('./lib/logger');
const _ = require('lodash');
const { addNetworks, getExistingNetworks, deleteNetworks, performSearch, pingApi } = require('./lib/api');
const { authenticate } = require('./lib/auth');
const { parseGmlToGeoJSON, parseShpToGeoJSON, parseGeoJSONToSearch, parseGeoJSONNetworks } = require('./lib/parser');
const { readConfig } = require('./lib/util');
const { writeGMLFromResponse } = require('./lib/writer');
const argv = require('yargs').argv;

process.on('unhandledRejection', (err) => {
  logger.error(err);
  process.exit(1);
});

async function compareNetworks(gmlFields, staticFields, geojsonNetworks, apiNetworks) {
  const validKeys = _.keys(_.invert(gmlFields))
    .concat(_.keys(_.invert(staticFields)))
    .concat('geometry');
  const networksToSend = [];
  // Pick out only the relevant fields for json comparison purposes
  const cleanedApiNetworks = _.map(apiNetworks, _.partial(_.pick, _, validKeys));
  const cleanedGeoJSONNetworks = _.map(geojsonNetworks, _.partial(_.pick, _, validKeys));
  let networksToCreate = 0;
  let networksToUpdate = 0;

  for (let [index, network] of cleanedGeoJSONNetworks.entries()) {
    const id = _.get(network, 'externalId');
    let networkToCompare = _.find(cleanedApiNetworks, { 'externalId': id });
    if (!networkToCompare) {
      logger.debug('Löydetty uusi verkko: ' + network.externalId);
      networksToCreate++;
      logger.debug(network);
      networksToSend.push(network);
    } else if (!_.isEqual(network, networkToCompare)) {
      logger.debug('Löydetty päivitettävä verkko: ' + network.externalId);
      networksToUpdate++;
      logger.debug('Verkkopäivitys:');
      logger.debug(network);
      logger.debug('Lähdeverkko:');
      logger.debug(networkToCompare);
      networksToSend.push(network);
    } else {
      logger.debug('Verkkoa ' + network.externalId + ' ei tarvitse päivittää');
      logger.debug(network);
    }
  }
  logger.info('Uusia verkkoja löydetty ' + networksToCreate + 'kpl, päivitettäviä ' + networksToUpdate + 'kpl. (yht. ' + networksToSend.length + 'kpl.)')
  return networksToSend;
}

async function processSearch(parameters, accessToken) {
  logger.info('Tunnistettu valitsin --search, haetaan kaikkien toimijoiden verkkoja rajapinnasta')
  geoJSON = parameters.searchArea;
  logger.info(geoJSON);
  const search = await parseGeoJSONToSearch(parameters, geoJSON);
  const response = await performSearch(parameters, accessToken, search);
  const networks = response.filter(function (network) {
    return (network.organizationName !== parameters.organizationName);
  });
  if (networks.entries()) {
    await writeGMLFromResponse(networks);
  } else {
    logger.info('Haku ei tuottanut tuloksia.');
    process.exit(1);
  }
}

async function processDeleteAll(parameters, accessToken, apiNetworkIds) {
  if (argv.dryrun) {
    logger.info('--dryrun -valitsimella ajettu työkalu ei poista rajapinnasta löytyviä verkkoja.')
  } else {
    logger.info('Poistetaan kaikki rajapinnasta löytyvät verkot.');
    await deleteNetworks(parameters, accessToken, apiNetworkIds);
    logger.info('Rajapinnan kaikki verkot poistettu, ohjelma suljetaan.');
    process.exit(1);
  }
}

async function processDelete(parameters, accessToken, geoJSONNetworks, apiNetworks) {
  const networksToDelete = apiNetworks.filter(function (array_el) {
    return geoJSONNetworks.filter(function (array2_el) {
      return array2_el.externalId === array_el.externalId;
    }).length === 0;
  });
  if (networksToDelete.length > 0) {
    logger.info('Poistettavia verkkoja löydetty ' + networksToDelete.length + ' kpl.');
    const networksToDeleteIds = networksToDelete.map(value => value.externalId);
    logger.info('Rajapinnasta poistettavat verkot: ' + networksToDeleteIds);
    if (!argv.dryrun) {
      await deleteNetworks(parameters, accessToken, networksToDeleteIds)
    }
  }
}

async function main() {
  const config = await readConfig();
  await pingApi(config.parameters);
  const accessToken = await authenticate(config.parameters);
  if (argv.search) {
    await processSearch(config.parameters, accessToken);
  } else {
  const geoJSON = await parseGmlToGeoJSON(config.parameters.gmlsource);

  const geoJSONNetworks = await parseGeoJSONNetworks(config.translations.gmlFields, config.translations.staticFields, geoJSON);
  const apiNetworks = JSON.parse(await getExistingNetworks(config.parameters, accessToken)).filter(function (network) {
    // ignore non-plan, non-externalid networks
    return (network.externalId && network.plan)
  });
  const apiNetworkIds = apiNetworks.map(value => value.externalId);
  logger.info('Rajapinnasta löytyneet rakennussuunnitelmat (' + apiNetworkIds.length + ' kpl): ' + apiNetworkIds);

  if (argv.deleteall) {
    await processDeleteAll(config.parameters, accessToken, apiNetworkIds)
  } else {
    await processDelete(config.parameters, accessToken, geoJSONNetworks, apiNetworks)
  }


  const networksToSend = await compareNetworks(config.translations.gmlFields, config.translations.staticFields, geoJSONNetworks, apiNetworks);
  if (networksToSend.length > 0) {
    logger.info('Rajapintaan lähtevät verkot: ' + networksToSend.map(value => value.externalId));
    if (!argv.dryrun) {
      await addNetworks(config.parameters, accessToken, networksToSend);
    }
  }

  if (argv.dryrun) {
    logger.info('Aja työkalu uudestaan ilman --dryrun -valitsinta mikäli haluat toteuttaa listatut muutokset.')
  }
  }

}

main();