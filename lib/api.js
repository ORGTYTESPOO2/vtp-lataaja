const request = require('request');
const logger = require('./logger');

async function getExistingNetworks(parameters, accessToken) {
  let options = {
    method: 'GET',
    url: parameters.target + 'verkko/omat/100000',
    headers:
      { 'Authorization': 'Bearer ' + accessToken }
  };

  return new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        resolve(body);
      } else {
        reject(error);
      }
    })
  })
}

async function deleteNetwork(parameters, accessToken, externalId) {
  let options = {
    method: 'POST',
    url: parameters.target + 'verkko/poista',
    headers: {
      'content-type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    },
    body:
      { externalId: externalId },
    json: true
  };

  return new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        logger.info('Poistettu verkko id:llä ' + externalId);
        resolve(body);
      } else {
        logger.error('Virhe verkon id ' + externalId + ' poistamisessa: ' + JSON.stringify(body));
        reject();
      }
    })
  })
}

async function deleteNetworks(parameters, accessToken, networksToDelete) {
  for (let [index, externalId] of networksToDelete.entries()) {
    await deleteNetwork(parameters, accessToken, externalId);
  }
}

async function addNetwork(parameters, accessToken, network) {

  let options = {
    method: 'POST',
    url: parameters.target + 'verkko',
    headers: {
      'content-type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    },
    body: {
      "externalId": network.externalId,
      "name": network.name,
      "networkType": network.networkType,
      "email": network.email,
      "readinessLevel": network.readinessLevel,
      "plan": network.plan,
      "freeText": network.freeText,
      "startDate": network.startDate,
      "endDate": network.endDate,
      "geometry": network.geometry
    },
    json: true,
    maxAttempts: 5,
    retryDelay: 5000
  };
  return new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        logger.info("Lisätty verkko id:llä " + network.externalId);
        resolve(body);
      } else {
        logger.error('Virhe verkon id ' + network.externalId + ' lisäämisessä: ' + JSON.stringify(body));
        reject();
      }
    })
  })

}

async function addNetworks(parameters, accessToken, networksToAdd) {
  let errors = [];
  for (let [index, network] of networksToAdd.entries()) {
    try {
      await addNetwork(parameters, accessToken, network);
    } catch (e) {
      //jatka
    }
  }
}

async function performSearch(parameters, accessToken, search) {
  let options = {
    method: 'POST',
    url: parameters.target + 'verkko/hae',
    headers: {
      'content-type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    },
    body: {
      "request": true,
      "geometry": search.geometry,
      "startDate": search.startDate,
      "endDate": search.endDate
    },
    json: true
  };

  return new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        logger.info('Verkkohakukysely 200 OK');
        resolve(body)
      } else {
        logger.error('Virhe verkkojen aluehaun tekemisessä: ' + JSON.stringify(body));
        reject();
      }
    })
  })
}

async function pingApi(parameters) {
  let options = {
    method: 'GET',
    url: parameters.target + 'ping'
  };
  return new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        logger.info('Rajapinta ottaa vastaan yhteyksiä, jatketaan.');
        resolve(body);
      } else {
        logger.error('Rajapintaan ei saada yhteyttä, työkalu suljetaan, vastaus rajapintaa pingatessa: \n'+ response.body);
        reject();
      }
    })
  })
}

module.exports = {
  getExistingNetworks,
  deleteNetworks,
  addNetworks,
  performSearch,
  pingApi
};