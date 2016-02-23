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
    this.lean = options.lean || false;
    this.overwrite = options.overwrite || true;
  }

  extend(obj) {
    return Proto.extend(obj, this);
  }

  _find(params, count, getFilter = filter) {
    const queryParams = params.query || {};
    const filters = getFilter(queryParams);
    const query = this.Model.find(queryParams).lean(this.lean);

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

    const executeQuery = total => {
      return query.exec().then(data => {
        return {
          total: total,
          limit: filters.$limit,
          skip: filters.$skip || 0,
          data
        };
      });
    };

    if(count) {
      return this.Model.where(queryParams).count().exec().then(executeQuery);
    }

    return executeQuery();
  }

  find(params) {
    const paginate = !!this.paginate.default;
    const result = this._find(params, paginate, query => filter(query, this.paginate));

    if(!paginate) {
      return result.then(page => page.data);
    }

    return result;
  }

  _get(id, params) {
    let modelQuery = this
      .Model
      .findOne({ [this.id]: id });

    if (params && params.query && params.query.$populate) {
      modelQuery = modelQuery.populate(params.query.$populate);
    }

    return modelQuery
      .lean(this.lean)
      .exec()
      .then(data => {
        if(!data) {
          throw new errors.NotFound(`No record found for id '${id}'`);
        }

        return data;
      })
      .catch(errorHandler);
  }

  get(id, params) {
    return this._get(id, params);
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

    const options = {new: true, overwrite: this.overwrite};

    if (this.id === '_id') {
      // We can not update default mongo ids
      delete data[this.id];
    } else {
      // If not using the default Mongo _id field set the id to its
      // previous value. This prevents orphaned documents.
      data[this.id] = id;
    }

    // NOTE (EK): We don't use the findByIdAndUpdate method because these are functionally
    // equivalent and this allows a developer to set their id field as something other than _id.
    return this
      .Model
      .findOneAndUpdate({ [this.id]: id }, data, options)
      .lean(this.lean)
      .exec()
      .then((result) => {
        return result;
      })
      .catch(errorHandler);
  }

  patch(id, data, params) {
    params.query = params.query || {};
    data = Object.assign({}, data);

    // If we are updating multiple records
    let multi = id === null;

    if (id !== null) {
      params.query[this.id] = id;
    }

    if (this.id === '_id') {
      // We can not update default mongo ids
      delete data[this.id];
    } else {
      // If not using the default Mongo _id field set the id to its
      // previous value. This prevents orphaned documents.
      data[this.id] = id;
    }

    return this
      .Model
      .update(params.query, { $set: data }, { multi })
      .lean(this.lean)
      .exec()
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
    return this
      ._getOrFind(id, params)
      .then(data => {
        return this.Model
                  .remove(query)
                  .lean(this.lean)
                  .exec()
                  .then(() => data)
                  .catch(errorHandler);
      })
      .catch(errorHandler);
  }
}

export default function init(options) {
  return new Service(options);
}

init.Service = Service;
