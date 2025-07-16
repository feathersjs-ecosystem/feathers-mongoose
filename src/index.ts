import * as hooks from './hooks';
import service, { MongooseAdapter, MongooseAdapterOptions } from './service';
import * as transactionManager from './transaction-manager';

// Export the service function with additional properties
const feathersMongoose = Object.assign(service, {
  hooks,
  Service: MongooseAdapter,
  service: MongooseAdapter,
  TransactionManager: transactionManager
});

// For CommonJS compatibility
module.exports = feathersMongoose;
module.exports.default = feathersMongoose;
module.exports.Service = MongooseAdapter;
module.exports.MongooseAdapter = MongooseAdapter;
module.exports.hooks = hooks;
module.exports.transactionManager = transactionManager;

export default feathersMongoose;
export { MongooseAdapter, MongooseAdapterOptions, hooks, transactionManager };
export * from './error-handler';
