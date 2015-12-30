'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = init;

var _uberproto = require('uberproto');

var _uberproto2 = _interopRequireDefault(_uberproto);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _feathersQueryFilters = require('feathers-query-filters');

var _feathersQueryFilters2 = _interopRequireDefault(_feathersQueryFilters);

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

var _errorHandler = require('./error-handler');

var _errorHandler2 = _interopRequireDefault(_errorHandler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

if (!global._babelPolyfill) {
  require('babel-polyfill');
}

// Use native promises
_mongoose2.default.Promise = global.Promise;

var Schema = _mongoose2.default.Schema;
// const ObjectId = mongoose.Types.ObjectId;

// Create the service.

var Service = (function () {
  function Service(options) {
    _classCallCheck(this, Service);

    if (!options) {
      throw new Error('Mongoose options have to be provided');
    }

    if (typeof options.name !== 'string') {
      throw new Error('A valid model name must be provided');
    }

    if (!options.Model) {
      throw new Error('You must provide a Model.\n\n        This could be an object literal, a mongoose Schema, or a mongoose Model.');
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
        } else {
          this.schema = this._createSchema(options);
        }

        _mongoose2.default.model(this.name, this.schema);
      }

    this._connect(options);
    this.Model = this.store.model(this.name);
  }

  _createClass(Service, [{
    key: 'extend',
    value: function extend(obj) {
      return _uberproto2.default.extend(obj, this);
    }
  }, {
    key: '_createSchema',
    value: function _createSchema(options) {
      var entity = options.Model;
      var schema = new Schema(entity.schema, options);

      // Map any instance methods to the mongoose schema
      if (entity.methods) {
        Object.keys(entity.methods).forEach(function (key) {
          schema.methods[key] = entity.methods[key];
        });
      }

      // Map any static methods to the mongoose schema
      if (entity.statics) {
        Object.keys(entity.statics).forEach(function (key) {
          schema.statics[key] = entity.statics[key];
        });
      }

      // Map any virtual attributes to the mongoose schema
      if (entity.virtuals) {
        Object.keys(entity.virtuals).forEach(function (key) {
          var value = entity.virtuals[key];

          Object.keys(value).forEach(function (method) {
            var fn = value[method];
            schema.virtual(key)[method](fn);
          });
        });
      }

      // Map and set any indexes on the mongoose schema
      if (entity.indexes) {
        Object.keys(entity.indexes).forEach(function (key) {
          var value = entity.indexes[key];
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

  }, {
    key: '_connect',
    value: function _connect(options) {
      var connectionString = options.connectionString;

      if (options.connection) {
        this.store = options.connection;
        return;
      }

      if (!connectionString) {
        var config = _extends({
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
      this.store = _mongoose2.default.createConnection(connectionString);
    }
  }, {
    key: 'find',
    value: function find(params) {
      params.query = params.query || {};
      var filters = (0, _feathersQueryFilters2.default)(params.query);
      var query = this.Model.find(params.query);

      if (this.paginate.default) {
        filters.$limit = Math.min(filters.$limit || this.paginate.default, this.paginate.max || Number.MAX_VALUE);
      }

      // $select uses a specific find syntax, so it has to come first.
      if (filters.$select && filters.$select.length) {
        var fields = {};

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = filters.$select[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var key = _step.value;

            fields[key] = 1;
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

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
      if (filters.$populate) {
        query.populate(filters.$populate);
      }

      var promise = query.exec();

      if (this.paginate.default && !params.query[this.id]) {
        var countQuery = this.Model.where(params.query).count().exec();

        return countQuery.then(function (total) {
          return promise.then(function (data) {
            return {
              total: total,
              limit: filters.$limit,
              skip: filters.$skip || 0,
              data: data
            };
          }).catch(_errorHandler2.default);
        }).catch(_errorHandler2.default);
      }

      return promise;
    }
  }, {
    key: 'get',
    value: function get(id, params) {
      params.query = params.query || {};
      params.query[this.id] = id;

      return this.find(params).then(function (data) {
        if (data && data.length !== 1) {
          throw new _feathersErrors2.default.NotFound('No record found for id \'' + id + '\'');
        }

        return data[0];
      }).catch(_errorHandler2.default);
    }
  }, {
    key: 'create',
    value: function create(data, params) {
      var _this = this;

      if (Array.isArray(data)) {
        return Promise.all(data.map(function (current) {
          return _this.create(current, params);
        }));
      }

      return this.Model.create(data).catch(_errorHandler2.default);
    }
  }, {
    key: 'patch',
    value: function patch(id, data, params) {
      var _this2 = this;

      params.query = params.query || {};
      data = _extends({}, data);
      var batch = false;

      if (id !== null) {
        params.query[this.id] = id;
      }
      // we are updating multiple records
      else {
          batch = true;
        }

      delete data[this.id];

      var query = this.Model.update(params.query, { $set: data }, { multi: batch });

      return query.then(function () {
        return _this2.find(params).then(function (items) {
          if (items.length === 0) {
            throw new _feathersErrors2.default.NotFound('No record found for id \'' + id + '\'');
          }

          if (items.length === 1) {
            return items[0];
          }

          return items;
        }).catch(_errorHandler2.default);
      }).catch(_errorHandler2.default);
    }
  }, {
    key: 'update',
    value: function update(id, data, params) {
      var _this3 = this;

      // NOTE (EK): First fetch the old record so
      // that we can fill any existing keys that the
      // client isn't updating with null;
      return this.get(id, params).then(function (oldData) {
        var newObject = {};
        var conditions = {};
        conditions[_this3.id] = id;

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = Object.keys(oldData.toObject())[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var key = _step2.value;

            if (data[key] === undefined) {
              newObject[key] = null;
            } else {
              newObject[key] = data[key];
            }
          }

          // NOTE (EK): Delete id field so we don't update it
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        delete newObject[_this3.id];

        return _this3.Model.update(conditions, newObject, { new: true }).then(function () {
          // NOTE (EK): Restore the id field so we can return it to the client
          newObject[_this3.id] = id;
          return newObject;
        }).catch(_errorHandler2.default);
      }).catch(_errorHandler2.default);
    }
  }, {
    key: 'remove',
    value: function remove(id, params) {
      var _this4 = this;

      params.query = params.query || {};

      // NOTE (EK): First fetch the record(s) so that we can return
      // it/them when we delete it/them.
      if (id !== null) {
        params.query[this.id] = id;
      }

      return this.find(params).then(function (items) {
        var query = _this4.Model.remove(params.query);

        return query.then(function () {
          if (items.length === 1) {
            return items[0];
          }

          return items;
        }).catch(_errorHandler2.default);
      }).catch(_errorHandler2.default);
    }
  }]);

  return Service;
})();

function init(options) {
  return new Service(options);
}

init.Service = Service;
module.exports = exports['default'];