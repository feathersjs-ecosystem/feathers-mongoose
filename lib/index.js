const hooks = require('./hooks');
const service = require('./service');

Object.assign(service, { hooks, service });

module.exports = service;
