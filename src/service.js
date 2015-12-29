if(!global._babelPolyfill) { require('babel-polyfill'); }

import Proto from 'uberproto';
import mongoose from 'mongoose';
import filter from 'feathers-query-filters';
import errors from 'feathers-errors';
import * as utils from './utils';

// Use native promises
mongoose.Promise = global.Promise;

const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

// Create the service.
class Service {
  constructor(options) {
    if (!options) {
      throw new Error('Mongoose options have to be provided');
    }

    if (typeof options.name !== 'string') {
      throw new Error('A valid model name must be provided');
    }

    if (!options.Model) {
      throw new Error(`You must provide a Model.\n
        This could be an object literal, a mongoose Schema, or a mongoose Model.`
      );
    }

    this.name = options.name;
    this.Model = options.Model;
    this.id = options.id || '_id';
    this.paginate = options.paginate || {};
    
    // Add feathers-hooks definitions.
    this.before = this.Model.before || undefined;
    this.after = this.Model.after || undefined;

    // It is a mongoose model already
    if (options.Model.modelName) {
      this.name = options.Model.modelName;
    }
    // It's not a model so we need to create one
    else {
      if (options.Model instanceof Schema) {
        this.schema = options.Model;
      }
      else {
        this.schema = this._createSchema(options);
      }
      
      mongoose.model(this.name, this.schema);
    }

    this._connect(options);
    this.Model = this.store.model(this.name);
  }

  extend(obj) {
    return Proto.extend(obj, this);
  }

  _createSchema(options){
    let entity = options.Model;
    let schema = new Schema(entity.schema, options);

    // Map any instance methods to the mongoose schema
    if (entity.methods) {
      Object.keys(entity.methods).forEach(key => {
        schema.methods[key] = entity.methods[key];
      });
    }

    // Map any static methods to the mongoose schema
    if (entity.statics) {
      Object.keys(entity.statics).forEach(key => {
        schema.statics[key] = entity.statics[key];
      });
    }

    // Map any virtual attributes to the mongoose schema
    if (entity.virtuals) {
      Object.keys(entity.virtuals).forEach(key => {
        let value = entity.virtuals[key];

        Object.keys(value).forEach(method => {
          let fn = value[method];
          schema.virtual(key)[method](fn);
        });
      });
    }

    // Map and set any indexes on the mongoose schema
    if (entity.indexes) {
      Object.keys(entity.indexes).forEach(key => {
        let value = entity.indexes[key];
        schema.index(value);
      });
    }

    return schema;
  }

  // NOTE (EK): We create a new database connection for every MongooseService.
  // This may not be good but... in the mean time the rationale for this
  // design is because each user of a MongooseService instance could be a separate
  // app residing on a totally different server, or each service could talk to
  // totally different databases.

  // TODO (EK): We need to handle replica sets.
  _connect(options) {
    var connectionString = options.connectionString;

    if (options.connection) {
      this.store = options.connection;
      return;
    }

    if (!connectionString) {
      var config = Object.assign({
        host: 'localhost',
        port: 27017,
        db: 'feathers',
        reconnect: true
      }, options);

      connectionString = 'mongodb://';

      if (config.username && config.password) {
        connectionString += config.username + ':' + config.password + '@';
      }

      connectionString += config.host + ':' + config.port + '/' + config.db;

      if (config.reconnect) {
        connectionString += '?auto_reconnect=true';
      }
    }

    // TODO (EK): Support mongoose connection options
    // http://mongoosejs.com/docs/connections.html
    this.store = mongoose.createConnection(connectionString);
  }

  find(params) {
    params.query = params.query || {};
    let filters = filter(params.query);
    let query = this.Model.find(params.query);

    if (this.paginate.default) {
      filters.$limit = Math.min(filters.$limit || this.paginate.default,
        this.paginate.max || Number.MAX_VALUE);
    }

    // $select uses a specific find syntax, so it has to come first.
    if (filters.$select && filters.$select.length) {
      let fields = {};
      
      Object.keys(filters.$select).forEach(key => {
        fields[key] = 1;
      });

      query.select(fields);
    }

    // Handle $sort
    if (filters.$sort) {
      query.sort(filters.$sort);
    }

    // Handle $limit
    if (filters.$limit) {
      query.limit(filters.$limit);
    }

    // Handle $skip
    if (filters.$skip) {
      query.skip(filters.$skip);
    }

    // Handle $populate
    if (filters.$populate){
      query.populate(filters.$populate);
    }

    let promise = query.exec();

    if (this.paginate.default && !params.query[this.id]) {
      let countQuery = this.Model.where(params.query).count().exec();

      return countQuery.then(function(total) {
        return promise.then(data => {
          return {
            total: total,
            limit: filters.$limit,
            skip: filters.$skip || 0,
            data
          };
        }).catch(utils.errorHandler);
      }).catch(utils.errorHandler);
    }

    return promise.catch(utils.errorHandler);
  }

  get(id, params) {
    params.query = params.query || {};
    params.query[this.id] = new ObjectId(id);

    return this.find(params).then(data => {
      if (data && data.length !== 1) {
        throw new errors.NotFound(`No record found for id '${id}'`);
      }

      return data[0];
    }).catch(utils.errorHandler);
  }

  create(data, params) {
    if(Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params)));
    }

    return this.Model.create(data).catch(utils.errorHandler);
  }

  patch(id, data, params) {
    params.query = params.query || {};
    data = Object.assign({}, data);
    let batch = false;

    if (id !== null) {
      params.query[this.id] = new ObjectId(id);
    }
    // we are updating multiple records
    else {
      batch = true;
    }

    delete data[this.id];

    let query = this.Model.update(params.query, {$set: data}, { multi: batch });

    return query.then((data) => {
      return this.find(params).then(items => {
        if (items.length ===  0) {
          throw new errors.NotFound(`No record found for id '${id}'`);
        }

        if (items.length === 1) {
          return items[0];
        }

        return items;
      }).catch(utils.errorHandler);
    }).catch(utils.errorHandler);
  }

  update(id, data, params) {
    // NOTE (EK): First fetch the old record so
    // that we can fill any existing keys that the
    // client isn't updating with null;
    return this.get(id, params).then(oldData => {
      let newObject = {};
      let conditions = {};
      conditions[this.id] = new ObjectId(id);

      for (var key of Object.keys(oldData)) {
        if (data[key] === undefined) {
          newObject[key] = null;
        } else {
          newObject[key] = data[key];
        }
      }

      // NOTE (EK): Delete id field so we don't update it
      delete newObject[this.id];

      return this.Model.update(conditions, newObject).then(() => {
        // NOTE (EK): Restore the id field so we can return it to the client
        newObject[this.id] = id;
        return newObject;
      }).catch(utils.errorHandler);
    }).catch(utils.errorHandler);
  }

  remove(id, params) {
    params.query = params.query || {};

    // NOTE (EK): First fetch the record(s) so that we can return
    // it/them when we delete it/them.
    if (id !== null) {
      params.query[this.id] = new ObjectId(id);
    }

    return this.find(params).then(items => {
      let query = this.Model.remove(params.query);

      return query.then(() => {
        if (items.length === 1) {
          return items[0];
        }

        return items;
      }).catch(utils.errorHandler);
    }).catch(utils.errorHandler);
  }
}

export default function init(options) {
  return new Service(options);
}

init.Service = Service;