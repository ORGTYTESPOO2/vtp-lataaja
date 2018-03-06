const { isURL } = require('./util');
const logger = require('./logger');
const ogr2ogr = require('ogr2ogr');
const gp = require("geojson-precision");
const request = require('request');
const _ = require('lodash');

async function parseGmlToGeoJSON(gmlSource) {
  if (isURL(gmlSource)) {
    logger.info('Ladataan GML-tiedosto osoitteesta ' + gmlSource);
    gmlSource = await request.get(gmlSource);
  } else {
    logger.info('Ladataan GML-tiedosto polusta ' + gmlSource)
  }

  return new Promise(function (resolve, reject) {
    const ogr = ogr2ogr(gmlSource).project('EPSG:3067');
    ogr.exec(function (error, data) {
      if (!error) {
        resolve(data);
      } else {
        logger.error('GeoJSONin muodostus GML:stä epäonnistui: ' + error);
        reject();
      }
    })
  })
}

async function parseShpToGeoJSON(searchSource) {
  if (isURL(searchSource)) {
    logger.info('Ladataan shapefile verkkohakue varten osoitteesta ' + searchSource)
    searchSource = await request.get(searchSource);
  } else {
    logger.info('Ladataan shapefile verkkohakua varten polusta ' + searchSource)
  }
  return new Promise(function (resolve, reject) {
    const ogr = ogr2ogr(searchSource).project('EPSG:3067');
    ogr.exec(function (error, data) {
      if (!error) {
        resolve(data)
      } else {
        logger.error('GeoJSONin muodostus shapefilestä epäonnistui: ' + error);
        reject();
      }
    })
  })
}

async function parseGeoJSONToSearch(parameters, geojson) {
  let search = {};
  // note that this may work unexpectedly, as would the VTP api, if the shapefile contains multiple features
//  search.geometry = JSON.stringify(geojson.features[0].geometry);
//  search.geometry = JSON.stringify(geojson);
  search.geometry = geojson;
  search.request = true;
  search.startDate = parameters.searchStartDate;
  search.endDate = parameters.searchEndDate;
  return search;
}

async function parseGeoJSONNetworks(gmlFields, staticFields, geoJSON) {
  const networks = [];

  for (let [index, feature] of geoJSON.features.entries()) {
    let network = [];

    const a = _.pullAll(feature, [feature.properties, feature.geometry]);

    network = _.reduce(a.properties, function (result, value, key) {
      key = gmlFields[key] || key;
      result[key] = value;
      return result;
    }, {});

    //semi hack to remove the hanging T00:00:00 time stamp included in GML datetimes
    network.startDate = network.startDate.split('T')[0];
    network.endDate = network.endDate.split('T')[0];

    network = _.merge(network, _.invert(staticFields));
    //convert field value to boolean
    network.plan = !!network.plan;
    //round to 8 decimal points to avoid issues with VTP api doing inconsistent rounding
    network.geometry = JSON.stringify(gp.parse((a.geometry), 8));
    networks.push(network);
  }
  if (networks.length === 0) {
    logger.error('GML-tiedostosta muodostuneesta GeoJSONista ei saatu tuotettua verkkoja');
    process.exit(1);
  }

  const networkIds = networks.map(value => value.externalId);
  logger.debug('GML:stä löydetyt verkot (' + networkIds.length + ' kpl): ' + networkIds);
  return networks;
}

module.exports = {
  parseGmlToGeoJSON,
  parseShpToGeoJSON,
  parseGeoJSONToSearch,
  parseGeoJSONNetworks
}