import { AdapterBase, filterQuery, select, AdapterParams, AdapterServiceOptions, getLimit, PaginationOptions } from '@feathersjs/adapter-commons';
import * as errors from '@feathersjs/errors';
import { Model, Query, PopulateOptions, ClientSession, Document, Schema } from 'mongoose';
import { Id, Paginated } from '@feathersjs/feathers';

import { errorHandler } from './error-handler';

export interface MongooseAdapterOptions<T extends Document = Document> extends AdapterServiceOptions {
  Model: Model<T>;
  lean?: boolean;
  overwrite?: boolean;
  discriminators?: Model<T>[];
  useEstimatedDocumentCount?: boolean;
  queryModifier?: (query: Query<T, T>) => void;
}

export interface MongooseAdapterParams extends AdapterParams {
  mongoose?: {
    session?: ClientSession;
    upsert?: boolean;
    writeResult?: boolean;
  };
  query?: {
    $populate?: PopulateOptions | PopulateOptions[];
    [key: string]: unknown;
  };
  queryModifier?: ((query: Query<Document, Document>) => void) | false;
  collation?: MongooseCollation;
}

export type AdapterId = Id;
export type NullableAdapterId = AdapterId | null;

interface FindManyOptions {
  multi: boolean;
  runValidators: boolean;
  context: string;
  session?: ClientSession;
  upsert?: boolean;
}

interface FindOneOptions extends Omit<FindManyOptions, 'multi'> {
  new: boolean;
  overwrite?: boolean;
  setDefaultsOnInsert?: boolean;
}

interface MongooseCollation {
  locale: string;
  strength?: number;
  [key: string]: unknown;
}

// Constants for commonly used filter keys
const FILTER_KEYS_IGNORE_FOR_ESTIMATION = new Set(['$limit', '$skip', '$sort', '$select']);
const DEFAULT_DISCRIMINATOR_KEY = '__t';
const DEFAULT_WHITELIST = ['$regex'];

// Create the base adapter
export class MongooseAdapter<
  Result extends Document = Document,
  Data = Partial<Result>,
  ServiceParams extends MongooseAdapterParams = MongooseAdapterParams,
  PatchData = Partial<Data>
> extends AdapterBase<Result, Data, PatchData, ServiceParams, MongooseAdapterOptions<Result>> {
  Model: Model<Result>;
  lean: boolean;
  overwrite: boolean;
  discriminatorKey: string;
  discriminators: Record<string, Model<Result>>;
  useEstimatedDocumentCount: boolean;

  constructor(options: MongooseAdapterOptions<Result>) {
    if (!options.Model || !options.Model.modelName) {
      throw new Error('You must provide a Mongoose Model');
    }

    const { whitelist = DEFAULT_WHITELIST } = options;

    super({
      id: '_id',
      filters: {
        $populate(value: PopulateOptions | PopulateOptions[]) {
          return value;
        },
        ...(options.filters || {})
      },
      ...options,
      whitelist: whitelist.concat('$and')
    });

    this.Model = options.Model;
    this.lean = options.lean !== false;
    this.overwrite = options.overwrite !== false;
    this.discriminatorKey = (this.Model.schema as Schema).get('discriminatorKey') || DEFAULT_DISCRIMINATOR_KEY;
    this.discriminators = {};
    this.useEstimatedDocumentCount = options.useEstimatedDocumentCount !== false;

    (options.discriminators || []).forEach(element => {
      if (element.modelName) {
        this.discriminators[element.modelName] = element;
      }
    });
  }

  get id(): string {
    return this.options.id || '_id';
  }

  allowsMulti(method: string, params: MongooseAdapterParams = {}): boolean {
    // Check params.adapter.multi first (dynamic allowance)
    if (params.adapter && params.adapter.multi !== undefined) {
      if (typeof params.adapter.multi === 'boolean') {
        return params.adapter.multi;
      }
      if (Array.isArray(params.adapter.multi)) {
        return params.adapter.multi.includes(method);
      }
    }

    // Fall back to service-level multi option
    const multi = this.getOptions(params as ServiceParams).multi;

    if (multi === true || multi === false) {
      return multi;
    }

    return multi ? multi.includes(method) : false;
  }

  _getQueryModifier(params: MongooseAdapterParams = {}) {
    const { query: { $populate } = {} } = params;

    return (modelQuery: Query<any, any>) => {
      if ($populate) {
        // Optimize $populate handling with validation and normalization
        this.applyPopulate(modelQuery, $populate);
      }

      // Apply params-level query modifier first (if not explicitly disabled)
      if (params.queryModifier && typeof params.queryModifier === 'function') {
        params.queryModifier(modelQuery);
      } else if (params.queryModifier !== false && this.options.queryModifier && typeof this.options.queryModifier === 'function') {
        // Apply service-level query modifier if params.queryModifier is not false
        this.options.queryModifier(modelQuery);
      }

      return modelQuery;
    };
  }

  private applyPopulate(modelQuery: Query<any, any>, populate: PopulateOptions | PopulateOptions[]): void {
    try {
      // Validate and normalize populate parameter
      if (typeof populate === 'string') {
        modelQuery.populate(populate);
      } else if (Array.isArray(populate)) {
        // Apply multiple populate options efficiently
        populate.forEach(pop => {
          if (pop && (typeof pop === 'string' || typeof pop === 'object')) {
            modelQuery.populate(pop);
          }
        });
      } else if (typeof populate === 'object' && populate !== null) {
        modelQuery.populate(populate);
      }
      // Ignore invalid populate parameters silently to prevent errors
    } catch (error) {
      // Log warning in development but don't throw to prevent service disruption
      if (process.env.NODE_ENV === 'development') {
        console.warn('Invalid $populate parameter:', populate, error);
      }
    }
  }

  private getModelForParams(params: MongooseAdapterParams): Model<Result> {
    const discriminator = (params.query as Record<string, unknown> || {})[this.discriminatorKey] || this.discriminatorKey;
    return this.discriminators[discriminator as string] || this.Model;
  }

  private applyCollation(query: Query<any, any>, params: MongooseAdapterParams): void {
    if (params.collation) {
      query.collation(params.collation);
    }
  }

  private checkIdConflict(query: Record<string, unknown>, providedId: Id): void {
    if (query[this.id] !== undefined && query[this.id] !== providedId) {
      throw new errors.NotFound(`No record found for id '${providedId}'`);
    }
  }

  private buildFinalQuery(query: Record<string, unknown>, id: Id): Record<string, unknown> {
    const finalQuery = { ...query };
    finalQuery[this.id] = id;
    return finalQuery;
  }

  private async performOptimizedMultiPatch(
    model: Model<Result>,
    query: Record<string, unknown>,
    data: PatchData,
    options: FindManyOptions,
    params: MongooseAdapterParams
  ): Promise<Result[] | Record<string, unknown>> {
    // Direct update without pre-querying IDs - much faster for write-only operations
    const updateQuery = model.updateMany(query as any, data as any, options).session(params.mongoose && params.mongoose.session || null);
    this.applyCollation(updateQuery, params);
    const updateResult = await updateQuery;

    // Return the raw MongoDB update result for write operations
    return updateResult as unknown as Record<string, unknown>;
  }

  private async performSingleDocumentPatch(
    model: Model<Result>,
    query: Record<string, unknown>,
    data: PatchData,
    options: FindOneOptions,
    filters: { $select?: string[] },
    params: MongooseAdapterParams
  ): Promise<Result | Record<string, unknown>> {
    const findOneOptions: FindOneOptions = {
      ...options,
      new: true,
      runValidators: true,
      context: 'query'
    };

    const modelQuery = model.findOneAndUpdate(query, data as any, findOneOptions).session(params.mongoose && params.mongoose.session || null);

    this.applySelect(modelQuery, filters.$select);
    this.applyCollation(modelQuery, params);
    this._getQueryModifier(params)(modelQuery);

    const updateResult = await modelQuery;

    // Handle writeResult format
    if (params.mongoose && params.mongoose.writeResult) {
      return {
        acknowledged: true,
        modifiedCount: updateResult ? 1 : 0,
        upsertedCount: 0,
        matchedCount: updateResult ? 1 : 0
      };
    }

    if (!updateResult && !(params.mongoose && params.mongoose.upsert)) {
      throw new errors.NotFound(`No record found for id '${query[this.id]}'`);
    }

    return select(params, this.id)(updateResult);
  }

  private async performMultiDocumentPatch(
    model: Model<Result>,
    query: Record<string, unknown>,
    data: PatchData,
    options: FindManyOptions,
    params: MongooseAdapterParams,
    collectedIds: Promise<Id[]>
  ): Promise<Result[] | Record<string, unknown>> {
    const updateQuery = model.updateMany(query, data as any, options).session(params.mongoose && params.mongoose.session || null);
    this.applyCollation(updateQuery, params);
    const updateResult = await updateQuery;

    if (params.mongoose && params.mongoose.writeResult) {
      return updateResult as unknown as Record<string, unknown>;
    }

    const idList = await collectedIds;

    // Handle upsert case where no documents existed before
    if (idList.length === 0 && params.mongoose && params.mongoose.upsert && updateResult.upsertedCount > 0) {
      const result = await this._find({
        ...params,
        paginate: false,
        query: params.query || {}
      } as ServiceParams);
      return Array.isArray(result) ? result : result.data || [];
    }

    if (idList.length === 0) {
      return [];
    }

    // Use the collected IDs to re-query the updated items
    const result = await this._find({
      ...params,
      paginate: false,
      query: { [this.id]: { $in: idList } }
    } as ServiceParams);

    return Array.isArray(result) ? result : result.data || [];
  }

  private applySelect(modelQuery: Query<any, any>, $select: any): void {
    if ($select) {
      const selectFields = Array.isArray($select) ? [...$select] : $select;
      if (Array.isArray(selectFields) && !selectFields.includes(this.id)) {
        selectFields.push(this.id);
      }
      modelQuery.select(selectFields);
    }
  }

  async _find(params?: ServiceParams & { paginate?: PaginationOptions }): Promise<Paginated<Result>>;
  async _find(params?: ServiceParams & { paginate: false }): Promise<Result[]>;
  async _find(params?: ServiceParams): Promise<Paginated<Result> | Result[]>;
  async _find(params?: ServiceParams): Promise<Paginated<Result> | Result[]> {
    const mongooseParams = params as MongooseAdapterParams || {};
    // Get options with params.paginate properly merged first
    const options = this.getOptions(params as ServiceParams);
    const { paginate } = options;

    // Pass merged options to filterQuery
    const { filters, query } = filterQuery(mongooseParams.query || {}, { ...this.options, paginate });

    // Determine if pagination is disabled
    const paginationDisabled = paginate === false || (!paginate || (typeof paginate === 'object' && !paginate.default));

    // Apply getLimit only if pagination is enabled
    if (!paginationDisabled && paginate) {
      const $limit = getLimit(filters.$limit, paginate);
      filters.$limit = $limit;
    }

    // If $or was moved to filters, add it back to query
    if (filters.$or) {
      query.$or = filters.$or;
    }

    // If $and was moved to filters, add it back to query
    if (filters.$and) {
      query.$and = filters.$and;
    }

    const getData = async () => {
      const model = this.getModelForParams(mongooseParams);
      const q = model.find(query as any).lean(this.lean);

      // $select uses a specific find syntax, so it has to come first.
      this.applySelect(q, filters.$select);

      if (filters.$sort) {
        q.sort(filters.$sort);
      }

      if (filters.$skip !== undefined) {
        q.skip(filters.$skip);
      }

      if (filters.$limit !== undefined) {
        q.limit(filters.$limit);
      }

      this.applyCollation(q, mongooseParams);
      this._getQueryModifier(mongooseParams)(q);

      return q.session(mongooseParams.mongoose && mongooseParams.mongoose.session || null).exec();
    };

    const countDocuments = async () => {
      const model = this.getModelForParams(mongooseParams);
      if (mongooseParams.mongoose && mongooseParams.mongoose.session) {
        // In transactions, use aggregation to count
        const aggregationPipeline = [
          { $match: query },
          { $count: 'total' }
        ];

        // Add collation to aggregation if provided
        const aggOptions: Record<string, unknown> = {};
        if (mongooseParams.collation) {
          aggOptions.collation = mongooseParams.collation;
        }

        const result = await model.aggregate(aggregationPipeline, aggOptions).session(mongooseParams.mongoose.session).exec();
        const count = result[0] && result[0].total || 0;
        return count;
      } else {
        // Outside transactions, use the normal count methods
        // Use estimatedDocumentCount only if no query filters (including from original params.query) and useEstimatedDocumentCount is true
        const hasQueryFilters = Object.keys(query).length > 0 || Object.keys(filters).some(key => !FILTER_KEYS_IGNORE_FOR_ESTIMATION.has(key));
        const useEstimated = this.useEstimatedDocumentCount && !query.$where && !hasQueryFilters;

        if (useEstimated) {
          return await model.estimatedDocumentCount().exec();
        } else {
          const countQuery = model.countDocuments(query as any);
          this.applyCollation(countQuery, mongooseParams);
          return await countQuery.exec();
        }
      }
    };

    if (paginationDisabled) {
      if (filters.$limit === 0) {
        return [];
      }
      const data = await getData();
      return data as unknown as Result[];
    }

    if (filters.$limit === 0) {
      const total = await countDocuments();
      const result = {
        total,
        data: [],
        limit: filters.$limit,
        skip: filters.$skip || 0
      };
      return result;
    }

    // Performance optimization: Check if we need total count
    // Skip count when pagination is disabled
    const needsTotal = mongooseParams.paginate !== false;

    let data: any;
    let total: number | undefined;

    if (needsTotal) {
      // Execute both queries in parallel when total is needed
      [data, total] = await Promise.all([getData(), countDocuments()]);
    } else {
      // Only get data when total count is not needed
      data = await getData();
      // Use a placeholder total that indicates count was skipped
      total = -1;
    }

    const result = {
      total: total ?? 0,
      data,
      limit: filters.$limit,
      skip: filters.$skip || 0
    };
    return result;
  }

  async _get(id: Id, params?: ServiceParams): Promise<Result> {
    const mongooseParams = params as MongooseAdapterParams || {};
    const { filters, query } = filterQuery(mongooseParams.query || {}, this.options);
    const model = this.getModelForParams(mongooseParams);

    this.checkIdConflict(query, id);
    const finalQuery = this.buildFinalQuery(query, id);

    const modelQuery = model.findOne(finalQuery);

    // Handle $select with ID field inclusion
    this.applySelect(modelQuery, filters.$select);

    this._getQueryModifier(mongooseParams)(modelQuery);

    return modelQuery.session(mongooseParams.mongoose && mongooseParams.mongoose.session || null)
      .lean(this.lean).exec().then(data => {
        if (!data) {
          throw new errors.NotFound(`No record found for id '${id}'`);
        }

        return data as Result;
      }).catch(errorHandler);
  }

  async _create(data: Data, params?: ServiceParams): Promise<Result>;
  async _create(data: Data[], params?: ServiceParams): Promise<Result[]>;
  async _create(data: Data | Data[], params?: ServiceParams): Promise<Result | Result[]>;
  async _create(data: Data | Data[], params?: ServiceParams): Promise<Result | Result[]> {
    const mongooseParams = params as MongooseAdapterParams || {};
    const model = this.getModelForParams(mongooseParams);
    const { query: { $populate } = {} } = mongooseParams;
    const isMulti = Array.isArray(data);
    const dataArray = isMulti ? data : [data];

    // Check for multi-create without explicit allowance
    if (isMulti && !this.allowsMulti('create', mongooseParams)) {
      throw new errors.MethodNotAllowed('Can not create multiple entries. Set `multi: ["create"]` or `multi: true` in service options to allow multi-create. Alternatively, pass `params.adapter.multi` to allow multi-create for this request.');
    }

    return model.create(dataArray, { session: mongooseParams.mongoose && mongooseParams.mongoose.session }).then(results => {
      const result = isMulti ? results : results[0];

      if ($populate) {
        return model.populate(result, $populate);
      }

      return result;
    }).then(select(mongooseParams, this.id)).catch(errorHandler);
  }

  async _update(id: Id, data: Data, params?: ServiceParams): Promise<Result> {
    const mongooseParams = params as MongooseAdapterParams || {};
    const { query } = filterQuery(mongooseParams.query || {}, this.options);
    const model = this.getModelForParams(mongooseParams);
    const options = {
      new: true,
      overwrite: this.overwrite,
      runValidators: true,
      context: 'query',
      setDefaultsOnInsert: true,
      session: mongooseParams.mongoose && mongooseParams.mongoose.session
    };

    if (id === null) {
      const updateParams = Object.assign({}, mongooseParams, {
        provider: undefined,
        query: Object.assign({}, query)
      });

      return this._patch(null, data as unknown as PatchData, updateParams as ServiceParams) as unknown as Promise<Result>;
    }

    this.checkIdConflict(query, id);
    const finalQuery = this.buildFinalQuery(query, id);

    const modelQuery = model.findOneAndUpdate(finalQuery, data as any, options);

    this._getQueryModifier(mongooseParams)(modelQuery);

    return modelQuery.lean(this.lean).exec().then(result => {
      if (!result) {
        throw new errors.NotFound(`No record found for id '${id}'`);
      }

      return result as unknown as Result;
    }).then(select(mongooseParams, this.id)).catch(errorHandler);
  }

  async _patch(id: null, data: PatchData, params?: ServiceParams): Promise<Result[]>;
  async _patch(id: Id, data: PatchData, params?: ServiceParams): Promise<Result>;
  async _patch(id: Id | null, data: PatchData, params?: ServiceParams): Promise<Result | Result[]>;
  async _patch(id: Id | null, data: PatchData, params?: ServiceParams): Promise<Result | Result[]> {
    const mongooseParams = params as MongooseAdapterParams || {};
    const { filters, query } = filterQuery(mongooseParams.query || {}, this.options);
    const model = this.getModelForParams(mongooseParams);

    if (id === null && !this.allowsMulti('patch', mongooseParams)) {
      throw new errors.MethodNotAllowed('Can not patch multiple entries');
    }

    // Check for ID conflicts in single patch operations
    if (id !== null) {
      this.checkIdConflict(query, id);
    }

    // Build the final query
    const finalQuery = id !== null ? this.buildFinalQuery(query, id) : query;

    const options: FindManyOptions = {
      multi: id === null,
      runValidators: true,
      context: 'query',
      session: mongooseParams.mongoose && mongooseParams.mongoose.session,
      upsert: mongooseParams.mongoose && mongooseParams.mongoose.upsert || false
    };

    try {
      if (id !== null) {
        // Single document patch
        return await this.performSingleDocumentPatch(model, finalQuery, data, options as unknown as FindOneOptions, filters, mongooseParams) as Result;
      } else {
        // Multi document patch - optimized approach
        // Check if we need to return updated documents or just write result
        if (mongooseParams.mongoose && mongooseParams.mongoose.writeResult) {
          // If only write result is needed, skip the ID collection step
          return await this.performOptimizedMultiPatch(model, finalQuery, data, options, mongooseParams) as Result[];
        } else {
          // Standard approach: collect IDs before update for result retrieval
          const mapIds = (page: any) => Array.isArray(page) ? page : page.data || [];
          const collectedIds = this._find({ ...mongooseParams, paginate: false } as ServiceParams)
            .then(mapIds)
            .then((page: any[]) => page.map((current: any) => current[this.id]));

          return await this.performMultiDocumentPatch(model, finalQuery, data, options, mongooseParams, collectedIds) as Result[];
        }
      }
    } catch (e) {
      return errorHandler(e as any);
    }
  }

  async _remove(id: null, params?: ServiceParams): Promise<Result[]>;
  async _remove(id: Id, params?: ServiceParams): Promise<Result>;
  async _remove(id: Id | null, params?: ServiceParams): Promise<Result | Result[]>;
  async _remove(id: Id | null, params?: ServiceParams): Promise<Result | Result[]> {
    const mongooseParams = params as MongooseAdapterParams || {};
    const { query } = filterQuery(mongooseParams.query || {}, this.options);
    const model = this.getModelForParams(mongooseParams);

    if (id === null && !this.allowsMulti('remove', mongooseParams)) {
      throw new errors.MethodNotAllowed('Can not remove multiple entries. Set `multi: ["remove"]` or `multi: true` in service options to allow multi-remove. Alternatively, pass `params.adapter.multi` to allow multi-remove for this request.');
    }

    // Check if there's a conflicting ID in the query for single remove
    if (id !== null) {
      this.checkIdConflict(query, id);
    }

    const findParams = Object.assign({}, mongooseParams, {
      paginate: false,
      query: mongooseParams.query || {}
    });

    if (id !== null) {
      findParams.query = Object.assign({}, mongooseParams.query || {}, { [this.id]: id });
    }

    return this._find(findParams as ServiceParams).then(items => {
      const result = Array.isArray(items) ? items : (items as any).data || [items];

      // For single item removal, throw NotFound if item doesn't exist
      if (id !== null && (!result || result.length === 0 || !result[0])) {
        throw new errors.NotFound(`No record found for id '${id}'`);
      }

      const query2 = Object.assign({}, query);

      if (id !== null) {
        query2[this.id] = id;
      }

      return model.deleteMany(query2 as any).session(mongooseParams.mongoose && mongooseParams.mongoose.session || null).then(() => {
        return (id !== null ? result[0] || null : result) as Result | Result[];
      });
    }).catch(errorHandler);
  }

}
