const fs = require('fs');
const logger = require('./logger');
const jwt = require('jsonwebtoken');
const request = require('request');

function signJwt(parameters) {
  const rsa = fs.readFileSync('./config/' + parameters.rsakey);
  return jwt.sign({
    iss: parameters.iss,
    sub: parameters.sub,
    aud: parameters.aud,
    exp: Math.floor(Date.now() / 1000 + 3600)}, rsa, {algorithm: 'RS256'});
}

async function authenticate(parameters) {

  let options = {
    method: 'POST',
    url: parameters.target + 'getToken',
    headers:
      { 'content-type': 'application/x-www-form-urlencoded' },
    form:
      { jwt: (await signJwt(parameters))}
  };

  return new Promise(function (resolve, reject) {
    request(options, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        logger.info('Autentikoituminen verkkotietopisteen rajapintaan onnistunut');
        logger.info('Access token: ' + JSON.parse(body).access_token);
        resolve(JSON.parse(body).access_token);
      } else {
        logger.error('Tapahtui virhe rajapintaan autentikoitumisessa, vastaus: ' + body);
        reject();
      }
    })
  })
}

module.exports = {
  authenticate
};