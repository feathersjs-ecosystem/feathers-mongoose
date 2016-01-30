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

  _find(params, getFilter = filter) {
    params.query = params.query || {};
    let filters = getFilter(params.query);
    let query = this.Model.find(params.query);

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
  
  find(params) {
    const result = this._find(params, query => filter(query, this.paginate));
    
    if(!this.paginate.default) {
      return result.then(page => page.data);
    }
    
    return result;
  }

  _get(id) {
    return this.Model.findById(id).exec().then(data => {
      if(!data) {
        throw new errors.NotFound(`No record found for id '${id}'`);
      }

      return data;
    }).catch(errorHandler);
  }
  
  get(id) {
    return this._get(id);
  }
  
  _getOrFind(id, params) {
    if(id === null) {
      return this._find(params).then(page => page.data);
    }
    
    return this._get(id);
  }

  create(data) {
    return this.Model.create(data).catch(errorHandler);
  }
  
  update(id, data) {
    if(id === null) {
      return Promise.reject('Not replacing multiple records. Did you mean `patch`?');
    }
    
    // NOTE (EK): First fetch the old record so
    // that we can fill any existing keys that the
    // client isn't updating with null;
    return this._get(id).then(oldData => {
      let newObject = {};

      for ( let key of Object.keys(oldData.toObject()) ) {
        if (data[key] === undefined) {
          newObject[key] = null;
        } else {
          newObject[key] = data[key];
        }
      }

      // NOTE (EK): Delete id field so we don't update it
      delete newObject[this.id];

      return this.Model.update({ [this.id]: id }, newObject, {new: true}).then(() => {
        // NOTE (EK): Restore the id field so we can return it to the client
        newObject[this.id] = id;
        return newObject;
      }).catch(errorHandler);
    }).catch(errorHandler);
  }

  patch(id, data, params) {
    params.query = params.query || {};
    data = Object.assign({}, data);
    
    // If we are updating multiple records
    let multi = id === null;

    if (id !== null) {
      params.query[this.id] = id;
    }

    delete data[this.id];

    return this.Model.update(params.query, { $set: data }, { multi })
      .then(() => this._getOrFind(id, params))
      .catch(errorHandler);
  }
  
  remove(id, params) {
    const query = Object.assign({}, params.query);
    
    if (id !== null) {
      query[this.id] = id;
    }

    // NOTE (EK): First fetch the record(s) so that we can return
    // it/them when we delete it/them.
    return this._getOrFind(id, params)
      .then(data => this.Model.remove(query).then(() => data))
      .catch(errorHandler);
  }
}

export default function init(options) {
  return new Service(options);
}

init.Service = Service;
