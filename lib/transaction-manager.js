"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollbackTransaction = exports.commitTransaction = exports.beginTransaction = void 0;
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
const beginTransaction = async (context, skipPath = []) => {
    const client = context.app.get('mongoDbClient') || context.service.Model.db;
    try {
        // if the current path is not added to skipPath-list
        if (skipPath.indexOf(context.path) === -1) {
            // if there is no open-transaction appended already
            if (context.params && !context.params.transactionOpen) {
                const session = await client.startSession();
                await session.startTransaction();
                context.params.transactionOpen = true;
                context.params.mongoose = { ...context.params.mongoose, session };
            }
            context.enableTransaction = true; // true if transaction is enabled
        }
        else {
            context.enableTransaction = false;
        }
        return context;
    }
    catch (err) {
        throw new Error(`Error while starting session ${err}`);
    }
};
exports.beginTransaction = beginTransaction;
/**
 * To commit a mongo-transaction after save methods of mongo service
 *
 * @param context           context with params, result and DB-session
 * @return context          context with params, result and DB-session
 */
const commitTransaction = async (context) => {
    try {
        // if transaction is enabled during startSession
        if (context.enableTransaction) {
            // if context contains the mongoose session to be committed
            if (context.params &&
                context.params.mongoose &&
                context.params.mongoose.session) {
                await context.params.mongoose.session.commitTransaction();
                context.params.mongoose = { ...context.params.mongoose, session: undefined };
                context.params.transactionOpen = false; // reset transaction-open
                context.enableTransaction = false;
            }
        }
        return context;
    }
    catch (err) {
        throw new Error(`Error while commiting transaction ${err}`);
    }
};
exports.commitTransaction = commitTransaction;
/**
 * To rollback a mongo-transaction for any error thrown in service calls
 *
 * @param context            context with params and DB-session
 * @return context           context with params and DB-session
 */
const rollbackTransaction = async (context) => {
    try {
        // if transaction is enabled during startSession
        if (context.enableTransaction) {
            // if context contains the mongoose session to be committed
            if (context.params &&
                context.params.mongoose &&
                context.params.mongoose.session) {
                await context.params.mongoose.session.abortTransaction();
                context.params.mongoose = { ...context.params.mongoose, session: undefined };
                context.params.transactionOpen = false; // reset transaction-open
                context.enableTransaction = false;
            }
        }
        return context;
    }
    catch (err) {
        throw new Error(`Error while rolling-back transaction ${err}`);
    }
};
exports.rollbackTransaction = rollbackTransaction;
exports.default = {
    beginTransaction: exports.beginTransaction,
    commitTransaction: exports.commitTransaction,
    rollbackTransaction: exports.rollbackTransaction
};
//# sourceMappingURL=transaction-manager.js.map