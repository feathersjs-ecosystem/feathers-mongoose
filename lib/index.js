const hooks = require('./hooks');
const service = require('./service');
const transactionManager = require('./transaction-manager');

Object.assign(service, { hooks, service });

module.exports = service;
module.exports.TransactionManager = transactionManager;
