import * as hooks from './hooks';
import service, { MongooseAdapter, MongooseAdapterOptions } from './service';
import * as transactionManager from './transaction-manager';
declare const feathersMongoose: typeof service & {
    hooks: typeof hooks;
    Service: typeof MongooseAdapter;
    service: typeof MongooseAdapter;
    TransactionManager: typeof transactionManager;
};
export default feathersMongoose;
export { MongooseAdapter, MongooseAdapterOptions, hooks, transactionManager };
export * from './error-handler';
//# sourceMappingURL=index.d.ts.map