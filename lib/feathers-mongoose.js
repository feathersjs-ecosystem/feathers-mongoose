var _ = require('lodash');
var Proto = require('uberproto');
var mongoose = require('mongoose');
var errors = require('feathers-errors').types;
var filter = require('feathers-query-filters');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

var MongooseService = Proto.extend({

  init: function(modelName, entity, options) {
    options = options || {};

    if (!_.isString(modelName)) {
      throw new errors.GeneralError('Must provide a valid model name');
    }

    this.options = _.extend({}, options);
    this.type = 'mongoose';
    
    // Add feathers-hooks compatibility.
    this.before = entity.before || undefined;
    this.after = entity.after || undefined;

    // It is a mongoose model already
    if (entity.modelName) {
      this.name = entity.modelName;
    }
    // It's not a model so we need to create one
    else {
      this.name = modelName;

      if (entity instanceof Schema) {
        this.schema = entity;
      }
      else {
        this.schema = this._createSchema(entity);
      }
      
      mongoose.model(this.name, this.schema);
    }

    this._connect(this.options);
    this.model = this.store.model(this.name);
  },

  _createSchema: function(entity){
    var schema = new Schema(entity.schema, this.options);

    if (entity.methods) {
      _.each(entity.methods, function(val, key){
        schema.methods[key] = val;
      });
    }

    if (entity.statics) {
      _.each(entity.statics, function(val, key){
        schema.statics[key] = val;
      });
    }

    if (entity.virtuals) {
      _.each(entity.virtuals, function(val, key){
        _.each(val, function(fn, method){
          schema.virtual(key)[method](fn);
        });
      });
    }

    if (entity.indexes) {
      _.each(entity.indexes, function(val){
        schema.index(val);
      });
    }

    return schema;
  },

  // NOTE (EK): We create a new database connection for every MongooseService.
  // This may not be good but... in the mean time the rationale for this
  // design is because each user of a MongooseService instance could be a separate
  // app residing on a totally different server, or each service could talk to
  // totally different databases.

  // TODO (EK): We need to handle replica sets.
  _connect: function(options) {
    var connectionString = options.connectionString;

    if (options.connection) {
      this.store = options.connection;
      return;
    }

    if (!connectionString) {
      var config = _.extend({
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
  },

  find: function(params, cb) {
    if (_.isFunction(params)) {
      cb = params;
      params = {};
    }

    params.query = params.query || {};
    var filters = filter(params.query);

    var query = this.model.find(params.query);

    if (filters.$select && filters.$select.length) {
      var fields = {};
      
      _.each(filters.$select, function(key){
        fields[key] = 1;
      });

      query.select(fields);
    }

    if (filters.$sort){
      query.sort(filters.$sort);
    }

    if (filters.$limit){
      query.limit(filters.$limit);
    }

    if (filters.$skip){
      query.skip(filters.$skip);
    }

    if (filters.$populate){
      query.populate(filters.$populate);
    }

    query.exec(function(error, data) {
      if (error) {
        return cb(new errors.BadRequest(error));
      }

      cb(null, data);
    });
  },

  get: function(id, params, cb) {
    if(_.isFunction(id)) {
      cb = id;
      return cb(new errors.BadRequest('A string or number id must be provided'));
    }

    if(_.isFunction(params)) {
      cb = params;
      params = {};
    }

    var populate = params.query && params.query.populate ? params.query.populate : '';

    // TODO (EK): handle params.fields & params.options
    this.model
        .findById(new ObjectId(id.toString()))
        .populate(populate)
        .exec(function (error, data) {
          if (error) {
            return cb(new errors.BadRequest(error));
          }

          if (!data) {
            return cb(new errors.NotFound('No record found for id ' + id));
          }

          cb(null, data);
        });
  },

  // TODO (EK): Batch support for create, update, delete.
  create: function(data, params, cb) {
    if(_.isFunction(params)) {
      cb = params;
      params = {};
    }

    // Create our actual Model object
    this.model.create(data, function (error, data) {
      if (error) {
        return cb(new errors.BadRequest(error));
      }

      var args = Array.prototype.slice.call(arguments);
      data = args.slice(1, args.length);

      cb(null, data.length === 1 ? data[0] : data);
    });
  },

  patch: function(id, data, params, cb) {
    this.update.call(this, id, data, params, cb);
  },

  update: function(id, data, params, cb) {
    if (_.isFunction(data)) {
      cb = data;
      return cb(new errors.BadRequest('You need to provide data to be updated'));
    }

    if (_.isFunction(params)) {
      cb = params;
      params = {};
    }

    // TODO (EK): Support updating multiple docs. Maybe we just use feathers-batch
    this.model.findByIdAndUpdate(new ObjectId(id), data, {new: true}, function(error, data) {
      if (error) {
        return cb(new errors.BadRequest(error));
      }

      if (!data) {
        return cb(new errors.NotFound('No record found for id ' + id));
      }

      cb(null, data);
    });
  },

  remove: function(id, params, cb) {
    if(_.isFunction(params)) {
      cb = params;
      params = {};
    }

    this.model.findByIdAndRemove(new ObjectId(id), function(error, data) {
      if (error) {
        return cb(error);
      }

      if (!data) {
        return cb(new errors.NotFound('No record found for id ' + id));
      }

      cb(null, data);
    });
  }
});

module.exports = function(modelName, schema, options) {
  return Proto.create.call(MongooseService, modelName, schema, options);
};

module.exports.Service = MongooseService;

module.exports.mongoose = mongoose;
