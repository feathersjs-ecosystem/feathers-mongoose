var _ = require('lodash');
var Proto = require('uberproto');
var mongoose = require('mongoose');
var errors = require('feathers').errors.types;
var Schema = mongoose.Schema;
var ObjectId = mongoose.Types.ObjectId;

// Helpers
var parseQuery = function(query) {
  if (typeof query !== 'object') {
    return {};
  }

  // Parse query arguments
  for (var k in query) {
    if (typeof query[k] !== 'object') {
      try {
        query[k] = JSON.parse(query[k]);
      } catch (e) {
        console.log('Error:', e);
        query[k] = null;
      }
    }
  }

  return query;
};

var MongooseService = Proto.extend({
  // TODO (EK): How do we handle indexes?
  init: function(modelName, schema, options) {
    options = options || {};

    if(typeof modelName !== 'string') {
      throw new errors.GeneralError('Must provide a valid model name');
    }

    this.options = _.extend({}, options);

    this._connect(this.options);
    this.name = modelName;
    this.type = 'mongoose';
    this.schema = new Schema(schema, this.options);
    this.model = mongoose.model(this.name, this.schema);
  },

  // NOTE (EK): We create a new database connection for every MongooseService.
  // This may not be good but... in the mean time the rationale for this
  // design is because each user of a MongooseService instance could be a separate
  // app residing on a totally different server.

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
    this.store = mongoose.connect(connectionString);
  },

  find: function(params, cb) {
    if(_.isFunction(params)) {
      cb = params;
      params = {};
    }

    var query = parseQuery(params.query);
    
    this.model.find(query.conditions, query.fields, query.options, function (error, data) {
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

    var query = parseQuery(params.query);

    this.model.findById(new ObjectId(id), query.fields, query.options, function (error, data) {
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

  patch: this.update,

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