var _ = require('lodash');
var Proto = require('uberproto');
var mongoose = require('mongoose');
var errors = require('feathers').errors.types;
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

var MongooseService = Proto.extend({
  // TODO (EK): How do we handle indexes?
  init: function(modelName, entity, options) {
    options = options || {};

    if(typeof modelName !== 'string') {
      throw new errors.GeneralError('Must provide a valid model name');
    }

    this.options = _.extend({}, options);
    this.name = modelName;
    this.type = 'mongoose';
    this.schema = new Schema(entity.schema, this.options);

    if (entity.methods) {
      _.each(entity.methods, function(val, key){
        this.schema.methods[key] = val;
      }, this);
    }

    if (entity.statics) {
      _.each(entity.statics, function(val, key){
        this.schema.statics[key] = val;
      }, this);
    }

    if (entity.virtuals) {
      _.each(entity.virtuals, function(val, key){
        _.each(val, function(fn, method){
          this.schema.virtual(key)[method](fn);
        }, this);
      }, this);
    }

    if (entity.indexes) {
      _.each(entity.indexes, function(val){
        this.schema.index(val);
      }, this);
    }

    mongoose.model(this.name, this.schema);
    this._connect(this.options);
    this.model = this.store.model(this.name);
  },

  // NOTE (EK): We create a new database connection for every MongooseService.
  // This may not be good but... in the mean time the rationale for this
  // design is because each user of a MongooseService instance could be a separate
  // app residing on a totally different server, or each service could talk to
  // totally different databases.

  // TODO (EK): We need to handle replica sets.
  _connect: function(options) {
    var connectionString = options.connectionString;

    if(!connectionString) {
      var config = _.extend({
        host: 'localhost',
        port: 27017,
        db: 'feathers'
      }, options);

      connectionString = config.host + ':' + config.port + '/' + config.db;
    }

    if(options.username && options.password) {
      connectionString += options.username + ':' + options.password + '@';
    }

    if(options.reconnect) {
      connectionString += '?auto_reconnect=true';
    }

    // TODO (EK): Support mongoose connection options
    // http://mongoosejs.com/docs/connections.html
    this.store = mongoose.createConnection(connectionString);
  },

  find: function(params, cb) {
    if(_.isFunction(params)) {
      cb = params;
      params = {};
    }
      
    // TODO (EK): handle params.fields & params.options
    this.model.find(params.query, {}, {}, function (error, data) {
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

    // TODO (EK): handle params.fields & params.options
    this.model.findById(new ObjectId(id), {}, {}, function (error, data) {
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
    var model = new this.model(data);
    model.save(function (error, data) {
      if (error) {
        return cb(new errors.BadRequest(error));
      }

      cb(null, data.length === 1 ? data[0] : data);
    });
  },

  patch: function(id, data, params, cb) {
    this.update.apply(this, arguments);
  },

  update: function(id, data, params, cb) {
    if(_.isFunction(params)) {
      cb = params;
      params = {};
    }

    this.model.findByIdAndUpdate(new ObjectId(id), data, { upsert: true }, function(error, data) {
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