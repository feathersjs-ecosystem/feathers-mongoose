/**
 * To start a new session and initiate transaction on the session and set
 * mongoose-session in context-params to all consecutive service call if the
 * boolean
 *
 * @param {object} context                            context and all params
 * @param {[string]} skipPath      list of paths to exclude from transaction
 *                                                     -  Example: ['login']
 * @return {object} context                 context with db-session appended
 */
const beginTransaction = async (context, skipPath = []) => {
  const client = context.app.get('mongoDbClient');
  try {
    // if the current path is not added to skipPath-list
    if (skipPath.indexOf(context.path) === -1) {
      // if there is no open-transaction appended already
      if (context.params && !context.params.transactionOpen) {
        const session = await client.startSession();
        await session.startTransaction();
        context.params.transactionOpen = true;
        context.params.mongoose = { session };
      }
      context.enableTransaction = true; // true if transaction is enabled
    } else {
      context.enableTransaction = false;
    }
    return context;
  } catch (err) {
    throw new Error(`Error while starting session ${err}`);
  }
};

/**
 * To commit a mongo-transaction after save methods of mongo service
 *
 * @param {object} context           context with params, result and DB-session
 * @return {object} context          context with params, result and DB-session
 */
const commitTransaction = async context => {
  try {
    // if transaction is enabled during startSession
    if (context.enableTransaction) {
    // if context contains the mongoose session to be committed
      if (
        context.params &&
        context.params.mongoose &&
        context.params.mongoose.session
      ) {
        await context.params.mongoose.session.commitTransaction();
        context.params.mongoose = null;
        context.params.transactionOpen = false; // reset transaction-open
        context.enableTransaction = false;
      }
    }
    return context;
  } catch (err) {
    throw new Error(`Error while commiting transaction ${err}`);
  }
};

/**
 * To rollback a mongo-transaction for any error thrown in service calls
 *
 * @param {object} context            context with params and DB-session
 * @return {object} context           context with params and DB-session
 */
const rollbackTransaction = async context => {
  try {
    // if transaction is enabled during startSession
    if (context.enableTransaction) {
    // if context contains the mongoose session to be committed
      if (
        context.params &&
        context.params.mongoose &&
        context.params.mongoose.session
      ) {
        await context.params.mongoose.session.abortTransaction();
        context.params.mongoose = null;
        context.transactionOpen = false; // reset transaction-open
        context.enableTransaction = false;
      }
    }
    return context;
  } catch (err) {
    throw new Error(`Error while rolling-back transaction ${err}`);
  }
};

module.exports = {
  beginTransaction,
  commitTransaction,
  rollbackTransaction
};
