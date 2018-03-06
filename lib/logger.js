const winston = require('winston');
const config = require('../config/config.json');
const argv = require('yargs').argv;

function readLogFileName() {
  const date = new Date();
  const mm = date.getMonth() + 1;
  const dd = date.getDate();
  const yyyy = date.getFullYear();
  if (argv.api) {
    return ('./log/' + yyyy + '-' + mm + '-' + dd + '-' +
      config.api.parameters.logfile)
  } else {
    return ('./log/' + yyyy + '-' + mm + '-' + dd + '-' +
      config.testapi.parameters.logfile)
  }
}

const logger = new (winston.Logger)({

  colors: {
    debug: 'green',
    info: 'cyan',
    warn: 'yellow',
    error: 'red'
  },
  transports: [
    new winston.transports.Console({
      level: "info",
      colorize: true,
      prettyPrint: true,
      json: false
    }),
    new winston.transports.File({
      filename: readLogFileName(),
      level: 'debug',
      prettyPrint: true,
      json: true
    })
  ]
});

module.exports = logger;