"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseAdapter = void 0;
const adapter_commons_1 = require("@feathersjs/adapter-commons");
const errors = __importStar(require("@feathersjs/errors"));
const error_handler_1 = require("./error-handler");
// Constants for commonly used filter keys
const FILTER_KEYS_IGNORE_FOR_ESTIMATION = new Set(['$limit', '$skip', '$sort', '$select']);
const DEFAULT_DISCRIMINATOR_KEY = '__t';
const DEFAULT_WHITELIST = ['$regex'];
// Create the base adapter
class MongooseAdapter extends adapter_commons_1.AdapterBase {
    constructor(options) {
        if (!options.Model || !options.Model.modelName) {
            throw new Error('You must provide a Mongoose Model');
        }
        const { whitelist = DEFAULT_WHITELIST } = options;
        super({
            id: '_id',
            filters: {
                $populate(value) {
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
        this.discriminatorKey = this.Model.schema.get('discriminatorKey') || DEFAULT_DISCRIMINATOR_KEY;
        this.discriminators = {};
        this.useEstimatedDocumentCount = options.useEstimatedDocumentCount !== false;
        (options.discriminators || []).forEach(element => {
            if (element.modelName) {
                this.discriminators[element.modelName] = element;
            }
        });
    }
    get id() {
        return this.options.id || '_id';
    }
    allowsMulti(method, params = {}) {
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
        const multi = this.getOptions(params).multi;
        if (multi === true || multi === false) {
            return multi;
        }
        return multi ? multi.includes(method) : false;
    }
    _getQueryModifier(params = {}) {
        const { query: { $populate } = {} } = params;
        return (modelQuery) => {
            if ($populate) {
                // Optimize $populate handling with validation and normalization
                this.applyPopulate(modelQuery, $populate);
            }
            // Apply params-level query modifier first (if not explicitly disabled)
            if (params.queryModifier && typeof params.queryModifier === 'function') {
                params.queryModifier(modelQuery);
            }
            else if (params.queryModifier !== false && this.options.queryModifier && typeof this.options.queryModifier === 'function') {
                // Apply service-level query modifier if params.queryModifier is not false
                this.options.queryModifier(modelQuery);
            }
            return modelQuery;
        };
    }
    applyPopulate(modelQuery, populate) {
        try {
            // Validate and normalize populate parameter
            if (typeof populate === 'string') {
                modelQuery.populate(populate);
            }
            else if (Array.isArray(populate)) {
                // Apply multiple populate options efficiently
                populate.forEach(pop => {
                    if (pop && (typeof pop === 'string' || typeof pop === 'object')) {
                        modelQuery.populate(pop);
                    }
                });
            }
            else if (typeof populate === 'object' && populate !== null) {
                modelQuery.populate(populate);
            }
            // Ignore invalid populate parameters silently to prevent errors
        }
        catch (error) {
            // Log warning in development but don't throw to prevent service disruption
            if (process.env.NODE_ENV === 'development') {
                console.warn('Invalid $populate parameter:', populate, error);
            }
        }
    }
    getModelForParams(params) {
        const discriminator = (params.query || {})[this.discriminatorKey] || this.discriminatorKey;
        return this.discriminators[discriminator] || this.Model;
    }
    applyCollation(query, params) {
        if (params.collation) {
            query.collation(params.collation);
        }
    }
    checkIdConflict(query, providedId) {
        if (query[this.id] !== undefined && query[this.id] !== providedId) {
            throw new errors.NotFound(`No record found for id '${providedId}'`);
        }
    }
    buildFinalQuery(query, id) {
        const finalQuery = { ...query };
        finalQuery[this.id] = id;
        return finalQuery;
    }
    async performOptimizedMultiPatch(model, query, data, options, params) {
        // Direct update without pre-querying IDs - much faster for write-only operations
        const updateQuery = model.updateMany(query, data, options).session(params.mongoose && params.mongoose.session || null);
        this.applyCollation(updateQuery, params);
        const updateResult = await updateQuery;
        // Return the raw MongoDB update result for write operations
        return updateResult;
    }
    async performSingleDocumentPatch(model, query, data, options, filters, params) {
        const findOneOptions = {
            ...options,
            new: true,
            runValidators: true,
            context: 'query'
        };
        const modelQuery = model.findOneAndUpdate(query, data, findOneOptions).session(params.mongoose && params.mongoose.session || null);
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
        return (0, adapter_commons_1.select)(params, this.id)(updateResult);
    }
    async performMultiDocumentPatch(model, query, data, options, params, collectedIds) {
        const updateQuery = model.updateMany(query, data, options).session(params.mongoose && params.mongoose.session || null);
        this.applyCollation(updateQuery, params);
        const updateResult = await updateQuery;
        if (params.mongoose && params.mongoose.writeResult) {
            return updateResult;
        }
        const idList = await collectedIds;
        // Handle upsert case where no documents existed before
        if (idList.length === 0 && params.mongoose && params.mongoose.upsert && updateResult.upsertedCount > 0) {
            const result = await this._find({
                ...params,
                paginate: false,
                query: params.query || {}
            });
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
        });
        return Array.isArray(result) ? result : result.data || [];
    }
    applySelect(modelQuery, $select) {
        if ($select) {
            const selectFields = Array.isArray($select) ? [...$select] : $select;
            if (Array.isArray(selectFields) && !selectFields.includes(this.id)) {
                selectFields.push(this.id);
            }
            modelQuery.select(selectFields);
        }
    }
    async _find(params) {
        const mongooseParams = params || {};
        // Get options with params.paginate properly merged first
        const options = this.getOptions(params);
        const { paginate } = options;
        // Pass merged options to filterQuery
        const { filters, query } = (0, adapter_commons_1.filterQuery)(mongooseParams.query || {}, { ...this.options, paginate });
        // Determine if pagination is disabled
        const paginationDisabled = paginate === false || (!paginate || (typeof paginate === 'object' && !paginate.default));
        // Apply getLimit only if pagination is enabled
        if (!paginationDisabled && paginate) {
            const $limit = (0, adapter_commons_1.getLimit)(filters.$limit, paginate);
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
            const q = model.find(query).lean(this.lean);
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
                const aggOptions = {};
                if (mongooseParams.collation) {
                    aggOptions.collation = mongooseParams.collation;
                }
                const result = await model.aggregate(aggregationPipeline, aggOptions).session(mongooseParams.mongoose.session).exec();
                const count = result[0] && result[0].total || 0;
                return count;
            }
            else {
                // Outside transactions, use the normal count methods
                // Use estimatedDocumentCount only if no query filters (including from original params.query) and useEstimatedDocumentCount is true
                const hasQueryFilters = Object.keys(query).length > 0 || Object.keys(filters).some(key => !FILTER_KEYS_IGNORE_FOR_ESTIMATION.has(key));
                const useEstimated = this.useEstimatedDocumentCount && !query.$where && !hasQueryFilters;
                if (useEstimated) {
                    return await model.estimatedDocumentCount().exec();
                }
                else {
                    const countQuery = model.countDocuments(query);
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
            return data;
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
        let data;
        let total;
        if (needsTotal) {
            // Execute both queries in parallel when total is needed
            [data, total] = await Promise.all([getData(), countDocuments()]);
        }
        else {
            // Only get data when total count is not needed
            data = await getData();
            // Use a placeholder total that indicates count was skipped
            total = -1;
        }
        const result = {
            total: total !== null && total !== void 0 ? total : 0,
            data,
            limit: filters.$limit,
            skip: filters.$skip || 0
        };
        return result;
    }
    async _get(id, params) {
        const mongooseParams = params || {};
        const { filters, query } = (0, adapter_commons_1.filterQuery)(mongooseParams.query || {}, this.options);
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
            return data;
        }).catch(error_handler_1.errorHandler);
    }
    async _create(data, params) {
        const mongooseParams = params || {};
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
        }).then((0, adapter_commons_1.select)(mongooseParams, this.id)).catch(error_handler_1.errorHandler);
    }
    async _update(id, data, params) {
        const mongooseParams = params || {};
        const { query } = (0, adapter_commons_1.filterQuery)(mongooseParams.query || {}, this.options);
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
            return this._patch(null, data, updateParams);
        }
        this.checkIdConflict(query, id);
        const finalQuery = this.buildFinalQuery(query, id);
        const modelQuery = model.findOneAndUpdate(finalQuery, data, options);
        this._getQueryModifier(mongooseParams)(modelQuery);
        return modelQuery.lean(this.lean).exec().then(result => {
            if (!result) {
                throw new errors.NotFound(`No record found for id '${id}'`);
            }
            return result;
        }).then((0, adapter_commons_1.select)(mongooseParams, this.id)).catch(error_handler_1.errorHandler);
    }
    async _patch(id, data, params) {
        const mongooseParams = params || {};
        const { filters, query } = (0, adapter_commons_1.filterQuery)(mongooseParams.query || {}, this.options);
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
        const options = {
            multi: id === null,
            runValidators: true,
            context: 'query',
            session: mongooseParams.mongoose && mongooseParams.mongoose.session,
            upsert: mongooseParams.mongoose && mongooseParams.mongoose.upsert || false
        };
        try {
            if (id !== null) {
                // Single document patch
                return await this.performSingleDocumentPatch(model, finalQuery, data, options, filters, mongooseParams);
            }
            else {
                // Multi document patch - optimized approach
                // Check if we need to return updated documents or just write result
                if (mongooseParams.mongoose && mongooseParams.mongoose.writeResult) {
                    // If only write result is needed, skip the ID collection step
                    return await this.performOptimizedMultiPatch(model, finalQuery, data, options, mongooseParams);
                }
                else {
                    // Standard approach: collect IDs before update for result retrieval
                    const mapIds = (page) => Array.isArray(page) ? page : page.data || [];
                    const collectedIds = this._find({ ...mongooseParams, paginate: false })
                        .then(mapIds)
                        .then((page) => page.map((current) => current[this.id]));
                    return await this.performMultiDocumentPatch(model, finalQuery, data, options, mongooseParams, collectedIds);
                }
            }
        }
        catch (e) {
            return (0, error_handler_1.errorHandler)(e);
        }
    }
    async _remove(id, params) {
        const mongooseParams = params || {};
        const { query } = (0, adapter_commons_1.filterQuery)(mongooseParams.query || {}, this.options);
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
        return this._find(findParams).then(items => {
            const result = Array.isArray(items) ? items : items.data || [items];
            // For single item removal, throw NotFound if item doesn't exist
            if (id !== null && (!result || result.length === 0 || !result[0])) {
                throw new errors.NotFound(`No record found for id '${id}'`);
            }
            const query2 = Object.assign({}, query);
            if (id !== null) {
                query2[this.id] = id;
            }
            return model.deleteMany(query2).session(mongooseParams.mongoose && mongooseParams.mongoose.session || null).then(() => {
                return (id !== null ? result[0] || null : result);
            });
        }).catch(error_handler_1.errorHandler);
    }
}
exports.MongooseAdapter = MongooseAdapter;
//# sourceMappingURL=adapter.js.map