const fs = require('fs');
const ogr2ogr = require('ogr2ogr');
const config = require('../config/config.json');
const _ = require('lodash');
const logger = require('./logger');
const argv = require('yargs').argv;


async function readGMLFilePath() {
  const date = new Date();
  const mm = date.getMonth() + 1;
  const dd = date.getDate();
  const yyyy = date.getFullYear();
  let path;
  if (argv.api) {
//    path = ('./gml/' + yyyy + '-' + mm + '-' + dd + '-' + config.api.parameters.searchResultGMLFile)
path = ('./gml/' + config.api.parameters.searchResultGMLFile)
  } else {
    path = ('./gml/' + yyyy + '-' + mm + '-' + dd + '-' +
      config.testapi.parameters.searchResultGMLFile)
  }

  // To not overwrite previous GML results
/*  let fileNumber = 1;
  let fileName = path;
  while (fs.existsSync(fileName)) {
    fileName = path + '.' + fileNumber;
    fileNumber++;
  }*/
  fileName = path;
  
  return fileName;
}

async function writeGMLFromResponse(networks) {
  const collection= {"type": "FeatureCollection"};
  collection.crs = {"type": "name", "properties": {
    "name": "EPSG:3067"
  }};
  collection.features = [];
  for (let [index, entry] of networks.entries()) {
    logger.debug('Rajapinnasta haettu verkko:');
    logger.debug(entry);
    try {
      let network = {};
      network.type = "Feature";
      network.properties = _.reduce(entry, function (result, value, key) {
        result[key] = value;
        return result;
      }, {});
      delete network.properties.geometry;
      if (entry.request === true) {
        network.geometry = {};
        let geom = JSON.parse(entry.geometry);
        network.geometry.type = geom.type;
        if (network.geometry.type === 'GeometryCollection') {
          network.geometry.geometries = geom.geometries;
        } else {
          network.geometry.coordinates = geom.coordinates;
        }
      }
      collection.features.push(network);
    } catch (e) {
      logger.info('Verkon id' + entry.networkId + ' epäonnistui, jatketaan sen ohi.')
      logger.debug(entry);
    }
  }

  const ogr = ogr2ogr(collection).format('GML').skipfailures().timeout(400000);
  const stream = fs.createWriteStream(await readGMLFilePath());
  ogr.stream().pipe(stream);


  const gmlWriteDone = ('Kirjoitettu hakutulokset GML:stä tiedostoon ' + stream.path + ', ohjelma suljetaan.')

  ogr.stream().on('end', function () {
    logger.info(gmlWriteDone);
    process.exit(1);
  })
  ogr.stream().on('close', function () {
    logger.info(gmlWriteDone);
    process.exit(1);
  })
  stream.on('end', function () {
    logger.info(gmlWriteDone);
    process.exit(1);
  })
  stream.on('close', function () {
    logger.info(gmlWriteDone);
    process.exit(1);
  })
}

module.exports = {
  writeGMLFromResponse
}