import { HookContext, Application } from '@feathersjs/feathers';
import { Connection, ClientSession } from 'mongoose';
interface TransactionContext extends HookContext {
    app: Application & {
        get(key: 'mongoDbClient'): Connection;
    };
    service: any;
    params: {
        transactionOpen?: boolean;
        mongoose?: {
            session?: ClientSession;
        };
    };
    enableTransaction?: boolean;
}
/**
 * To start a new session and initiate transaction on the session and set
 * mongoose-session in context-params to all consecutive service call if the
 * boolean
 *
 * @param context                            context and all params
 * @param skipPath      list of paths to exclude from transaction
 *                                                     -  Example: ['login']
 * @return context                 context with db-session appended
 */
export declare const beginTransaction: (context: TransactionContext, skipPath?: string[]) => Promise<TransactionContext>;
export declare const commitTransaction: (context: TransactionContext) => Promise<TransactionContext>;
/**
 * To rollback a mongo-transaction for any error thrown in service calls
 *
 * @param context            context with params and DB-session
 * @return context           context with params and DB-session
 */
export declare const rollbackTransaction: (context: TransactionContext) => Promise<TransactionContext>;
declare const _default: {
    beginTransaction: (context: TransactionContext, skipPath?: string[]) => Promise<TransactionContext>;
    commitTransaction: (context: TransactionContext) => Promise<TransactionContext>;
    rollbackTransaction: (context: TransactionContext) => Promise<TransactionContext>;
};
export default _default;
//# sourceMappingURL=transaction-manager.d.ts.map