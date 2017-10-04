import omit from 'lodash.omit';
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

    // Handle collation
    if (params.collation) {
      q.collation(params.collation);
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
    const discriminator = data[this.discriminatorKey] || this.discriminatorKey;
    const model = this.discriminators[discriminator] || this.Model;
    return model.create(data)
      .then(result => {
        if (this.lean) {
          if (Array.isArray(result)) {
            return result.map(item => (item.toObject ? item.toObject() : item));
          }
          return result.toObject ? result.toObject() : result;
        }
        return result;
      })
      .then(select(params, this.id))
      .catch(errorHandler);
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

    if (params.collation) {
      query.collation = params.collation
    }

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
          const findParams = idList.length ? Object.assign({}, params, {
            query: {
              [this.id]: { $in: idList }
            }
          }) : params;

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

    if (params.collation) {
      query.collation = params.collation
    }

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
