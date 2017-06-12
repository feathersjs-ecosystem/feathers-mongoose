import omit from 'lodash.omit';
import isEqual from 'lodash.isequal';
import Proto from 'uberproto';
import filter from 'feathers-query-filters';
import { select } from 'feathers-commons';
import errors from 'feathers-errors';
import errorHandler from './error-handler';

// Create the service.
class Service {
  constructor (options) {
    if (!options) {
      throw new Error('Mongoose options have to be provided');
    }

    if (!options.Model || !options.Model.modelName) {
      throw new Error('You must provide a Mongoose Model');
    }

    this.Model = options.Model;
    this.discriminatorKey = this.Model.schema.options.discriminatorKey;
    this.discriminators = {};
    (options.discriminators || []).forEach(element => {
      if (element.modelName) {
        this.discriminators[element.modelName] = element;
      }
    });
    this.id = options.id || '_id';
    this.paginate = options.paginate || {};
    this.lean = options.lean === undefined ? true : options.lean;
    this.overwrite = options.overwrite !== false;
    this.events = options.events || [];
  }

  extend (obj) {
    return Proto.extend(obj, this);
  }

  _find (params, count, getFilter = filter) {
    const { filters, query } = getFilter(params.query || {});
    const discriminator = (params.query || {})[this.discriminatorKey] || this.discriminatorKey;
    const model = this.discriminators[discriminator] || this.Model;
    const q = model.find(query).lean(this.lean);

    // $select uses a specific find syntax, so it has to come first.
    if (Array.isArray(filters.$select)) {
      let fields = {};

      for (let key of filters.$select) {
        fields[key] = 1;
      }

      q.select(fields);
    } else if (typeof filters.$select === 'string' || typeof filters.$select === 'object') {
      q.select(filters.$select);
    }

    // Handle $sort
    if (filters.$sort) {
      q.sort(filters.$sort);
    }

    // Handle $limit
    if (typeof filters.$limit !== 'undefined') {
      q.limit(filters.$limit);
    }

    // Handle $skip
    if (filters.$skip) {
      q.skip(filters.$skip);
    }

    // Handle $populate
    if (filters.$populate) {
      q.populate(filters.$populate);
    }

    let executeQuery = total => {
      return q.exec().then(data => {
        return {
          total,
          limit: filters.$limit,
          skip: filters.$skip || 0,
          data
        };
      });
    };

    if (filters.$limit === 0) {
      executeQuery = total => {
        return Promise.resolve({
          total,
          limit: filters.$limit,
          skip: filters.$skip || 0,
          data: []
        });
      };
    }

    if (count) {
      return model.where(query).count().exec().then(executeQuery);
    }

    return executeQuery();
  }

  find (params) {
    const paginate = (params && typeof params.paginate !== 'undefined') ? params.paginate : this.paginate;
    const result = this._find(params, !!paginate.default,
      query => filter(query, paginate)
    );

    if (!paginate.default) {
      return result.then(page => page.data);
    }

    return result;
  }

  _get (id, params = {}) {
    params.query = params.query || {};

    const discriminator = (params.query || {})[this.discriminatorKey] || this.discriminatorKey;
    const model = this.discriminators[discriminator] || this.Model;
    let modelQuery = model
      .findOne({ [this.id]: id });

    // Handle $populate
    if (params.query.$populate) {
      modelQuery = modelQuery.populate(params.query.$populate);
    }

    // Handle $select
    if (params.query.$select && params.query.$select.length) {
      let fields = { [this.id]: 1 };

      for (let key of params.query.$select) {
        fields[key] = 1;
      }

      modelQuery.select(fields);
    } else if (params.query.$select && typeof params.query.$select === 'object') {
      modelQuery.select(params.query.$select);
    }

    return modelQuery
      .lean(this.lean)
      .exec()
      .then(data => {
        if (!data) {
          throw new errors.NotFound(`No record found for id '${id}'`);
        }

        return data;
      })
      .catch(errorHandler);
  }

  get (id, params) {
    return this._get(id, params);
  }

  _getOrFind (id, params) {
    if (id === null) {
      return this._find(params).then(page => page.data);
    }

    return this._get(id, params);
  }

  create (data, params) {
    if (Array.isArray(data)) {
      return this._createbulk(data, params);
    }

    const discriminator = data[this.discriminatorKey] || this.discriminatorKey;
    const model = this.discriminators[discriminator] || this.Model;
    return model.create(data)
      .then(result => (this.lean && result.toObject) ? result.toObject() : result)
      .then(select(params, this.id))
      .catch(errorHandler);
  }

  _createbulk (data, params) {
    return this._insertMany(data)
      .then(result => {
        if (!Array.isArray(result.data[1])) {
          return result;
        }
        result.data[1] = result.data[1].map(result => (this.lean && result.toObject) ? result.toObject() : result);
        return result;
      })
      .then(result => {
        if (!Array.isArray(result.data[1])) {
          return result;
        }
        result.data[1] = result.data[1].map(result => select(params, this.id)(result));
        return result;
      })
      .catch(errorHandler);
  }

  _insertMany (data) {
    const INSERT_MANY_CONVERT_OPTIONS = {
      depopulate: true,
      transform: false,
      _skipDepopulateTopLevel: true,
      flattenDecimals: false
    };
    const discriminator = data[this.discriminatorKey] || this.discriminatorKey;
    const Model = this.discriminators[discriminator] || this.Model;

    return new Promise((resolve, reject) => {
      if (!Array.isArray(data)) {
        data = [data];
      }

      // validate the docs against the mongoose schema
      const validate = function validate (doc) {  // sample async action
        return new Promise(resolve => {
          let model = new Model(doc);
          model.validate({ __noPromise: true }, error => {
            if (error) {
              // Resolve the error, so we can track it
              let errorDoc = new Error(error.message);
              errorDoc.data = omit(model.toJSON(), '__v');
              return resolve(error);
            }
            // resolve the validated model
            return resolve(model);
          });
        });
      };
      // Map the validate promises to be executed together
      let toExecute = data.map(validate);

      // Execute the validation promises
      Promise.all(toExecute)
      .then(docs => {
        // Filter out any errors
        let successDocs = docs.filter(doc => {
          return (!(doc instanceof Error) && doc !== null);
        });
        // Get the errors
        let errorDocs = docs.filter(doc => {
          return (doc instanceof Error);
        })
        .reduce((acc, cur) => {
          acc.push({ ValidationError: cur.message, data: cur.data });
          return acc;
        }, []);

        // Escape while there aren't any valid docs
        if (successDocs.length < 1) {
          // error first, then success documents
          // data[0] = errors
          // data[1] = success data
          resolve({ data: [errorDocs, null] });
          return;
        }

        // parse the documents as per mongoose functionality
        var docObjects = successDocs.map(function (doc) {
          if (doc.schema.options.versionKey) {
            doc[doc.schema.options.versionKey] = 0;
          }
          if (doc.initializeTimestamps) {
            return doc.initializeTimestamps().toObject(INSERT_MANY_CONVERT_OPTIONS);
          }
          return doc.toObject(INSERT_MANY_CONVERT_OPTIONS);
        });

        // Run the native insertMany method
        // { ordered: false } ## ordered operations stop after an error, while unordered operations continue to process any remaining write operations in the queue.
        Model.collection.insertMany(docObjects, { ordered: false }, (error, docs) => {
          let writeErrors;
          // If we have an error, lets find which docs where successful and return those
          if (error) {
            // Get a list of the insertIds, which will be all of the docs
            // as mongoose creates _ids client-side
            docs = docs.toJSON().insertedIds;

            // Check if we have singular error
            if (!error.writeErrors) {
              let _error = error.toJSON();
              writeErrors = [Object.assign({}, { WriteError: _error.errmsg }, { data: omit(_error.op, '__v') })];
            } else {
                // Get a list of the errors and the ids
                // so we can filter out the those that failed from the successful ones
              writeErrors = error.writeErrors.reduce((acc, cur) => {
                let error = cur.toJSON();
                acc.push(Object.assign({}, { WriteError: error.errmsg }, { data: omit(error.op, '__v') }));
                return acc;
              }, []);
            }
          }

          // If we have failed documents, filter them out
          if (writeErrors) {
            successDocs = successDocs.reduce((acc, doc) => {
              // remove duplicate key docs
              let errorDoc = writeErrors.find(curError => {
                let data = omit(doc.toJSON(), '__v');
                return isEqual(curError.data, data) && curError.WriteError.includes('duplicate key');
              });
              if (errorDoc) {
                return acc;
              }
              acc.push(doc);
              return acc;
            }, []);
            // Merge the validation errors with the write errors
            errorDocs = [...errorDocs, ...writeErrors];
          }

          // Map the mongoose methods to each document
          successDocs = successDocs.map(doc => {
            doc.isNew = false;
            doc.emit('isNew', false);
            doc.constructor.emit('isNew', false);
            return doc;
          });

          errorDocs = errorDocs.length ? errorDocs : null;
          successDocs = successDocs.length ? successDocs : null;

          // return combination of success and error documents
          // error first, then success documents
          // data[0] = errors
          // data[1] = success data
          resolve({ data: [errorDocs, successDocs] });
        });
      })
      .catch(err => {
        reject(err);
      });
    });
  }

  update (id, data, params) {
    if (id === null) {
      return Promise.reject(new errors.BadRequest('Not replacing multiple records. Did you mean `patch`?'));
    }

    // Handle case where data might be a mongoose model
    if (typeof data.toObject === 'function') {
      data = data.toObject();
    }

    const options = Object.assign({
      new: true,
      overwrite: this.overwrite,
      runValidators: true,
      context: 'query',
      setDefaultsOnInsert: true
    }, params.mongoose);

    if (this.id === '_id') {
      // We can not update default mongo ids
      data = omit(data, this.id);
    } else {
      // If not using the default Mongo _id field set the id to its
      // previous value. This prevents orphaned documents.
      data = Object.assign({}, data, { [this.id]: id });
    }

    const discriminator = (params.query || {})[this.discriminatorKey] || this.discriminatorKey;
    const model = this.discriminators[discriminator] || this.Model;
    let modelQuery = model.findOneAndUpdate({ [this.id]: id }, data, options);

    if (params && params.query && params.query.$populate) {
      modelQuery = modelQuery.populate(params.query.$populate);
    }

    return modelQuery
      .lean(this.lean)
      .exec()
      .then(select(params, this.id))
      .catch(errorHandler);
  }

  patch (id, data, params) {
    const query = Object.assign({}, filter(params.query || {}).query);
    const mapIds = page => page.data.map(current => current[this.id]);

    // By default we will just query for the one id. For multi patch
    // we create a list of the ids of all items that will be changed
    // to re-query them after the update
    const ids = id === null ? this._find(params)
        .then(mapIds) : Promise.resolve([ id ]);

    // Handle case where data might be a mongoose model
    if (typeof data.toObject === 'function') {
      data = data.toObject();
    }

    // ensure we are working on a copy
    data = Object.assign({}, data);

    // If we are updating multiple records
    let options = Object.assign({
      multi: id === null,
      runValidators: true,
      context: 'query'
    }, params.mongoose);

    if (id !== null) {
      query[this.id] = id;
    }

    if (this.id === '_id') {
      // We can not update default mongo ids
      delete data[this.id];
    } else if (id !== null) {
      // If not using the default Mongo _id field set the id to its
      // previous value. This prevents orphaned documents.
      data[this.id] = id;
    }

    // NOTE (EK): We need this shitty hack because update doesn't
    // return a promise properly when runValidators is true. WTF!
    try {
      return ids
        .then(idList => {
          // Create a new query that re-queries all ids that
          // were originally changed
          const findParams = Object.assign({}, params, {
            query: {
              [this.id]: { $in: idList }
            }
          });

          if (params.query && params.query.$populate) {
            findParams.query.$populate = params.query.$populate;
          }

          // If params.query.$populate was provided, remove it
          // from the query sent to mongoose.
          const discriminator = (params.query || {})[this.discriminatorKey] || this.discriminatorKey;
          const model = this.discriminators[discriminator] || this.Model;
          return model
            .update(omit(query, '$populate'), data, options)
            .lean(this.lean)
            .exec()
            .then(() => this._getOrFind(id, findParams));
        })
        .then(select(params, this.id))
        .catch(errorHandler);
    } catch (e) {
      return errorHandler(e);
    }
  }

  remove (id, params) {
    const query = Object.assign({}, filter(params.query || {}).query);

    if (id !== null) {
      query[this.id] = id;
    }

    // NOTE (EK): First fetch the record(s) so that we can return
    // it/them when we delete it/them.
    return this._getOrFind(id, params)
      .then(data =>
        this.Model
          .remove(query)
          .lean(this.lean)
          .exec()
          .then(() => data)
          .then(select(params, this.id))
      )
      .catch(errorHandler);
  }
}

export default function init (options) {
  return new Service(options);
}

init.Service = Service;
