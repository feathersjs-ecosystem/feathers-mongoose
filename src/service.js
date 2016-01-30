if(!global._babelPolyfill) { require('babel-polyfill'); }

import Proto from 'uberproto';
import filter from 'feathers-query-filters';
import errors from 'feathers-errors';
import errorHandler from './error-handler';

// Create the service.
class Service {
  constructor(options) {
    if (!options) {
      throw new Error('Mongoose options have to be provided');
    }

    if (!options.Model || !options.Model.modelName) {
      throw new Error('You must provide a Mongoose Model');
    }

    // this.name = options.name;
    this.Model = options.Model;
    this.id = options.id || '_id';
    this.paginate = options.paginate || {};
  }

  extend(obj) {
    return Proto.extend(obj, this);
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

      for (let key of filters.$select) {
        fields[key] = 1;
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
        }).catch(errorHandler);
      }).catch(errorHandler);
    }

    return promise;
  }

  get(id, params) {
    params.query = params.query || {};
    params.query[this.id] = id;

    return this.find(params).then(data => {
      if (data && data.length !== 1) {
        throw new errors.NotFound(`No record found for id '${id}'`);
      }

      return data[0];
    }).catch(errorHandler);
  }

  create(data) {
    return this.Model.create(data).catch(errorHandler);
  }

  patch(id, data, params) {
    params.query = params.query || {};
    data = Object.assign({}, data);
    let batch = false;

    if (id !== null) {
      params.query[this.id] = id;
    }
    // we are updating multiple records
    else {
      batch = true;
    }

    delete data[this.id];

    let query = this.Model.update(params.query, {$set: data}, { multi: batch });

    return query.then(() => {
      return this.find(params).then(items => {
        if (items.length ===  0) {
          throw new errors.NotFound(`No record found for id '${id}'`);
        }

        if (items.length === 1) {
          return items[0];
        }

        return items;
      }).catch(errorHandler);
    }).catch(errorHandler);
  }

  update(id, data, params) {
    // NOTE (EK): First fetch the old record so
    // that we can fill any existing keys that the
    // client isn't updating with null;
    return this.get(id, params).then(oldData => {
      let newObject = {};
      let conditions = {};
      conditions[this.id] = id;

      for ( let key of Object.keys(oldData.toObject()) ) {
        if (data[key] === undefined) {
          newObject[key] = null;
        } else {
          newObject[key] = data[key];
        }
      }

      // NOTE (EK): Delete id field so we don't update it
      delete newObject[this.id];

      return this.Model.update(conditions, newObject, {new: true}).then(() => {
        // NOTE (EK): Restore the id field so we can return it to the client
        newObject[this.id] = id;
        return newObject;
      }).catch(errorHandler);
    }).catch(errorHandler);
  }

  remove(id, params) {
    params.query = params.query || {};

    // NOTE (EK): First fetch the record(s) so that we can return
    // it/them when we delete it/them.
    if (id !== null) {
      params.query[this.id] = id;
    }

    return this.find(params).then(items => {
      let query = this.Model.remove(params.query);

      return query.then(() => {
        if (items.length === 1) {
          return items[0];
        }

        return items;
      }).catch(errorHandler);
    }).catch(errorHandler);
  }
}

export default function init(options) {
  return new Service(options);
}

init.Service = Service;
