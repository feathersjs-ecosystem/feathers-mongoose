import { AdapterBase, AdapterParams, AdapterServiceOptions, PaginationOptions } from '@feathersjs/adapter-commons';
import { Model, Query, PopulateOptions, ClientSession, Document } from 'mongoose';
import { Id, Paginated } from '@feathersjs/feathers';
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
interface MongooseCollation {
    locale: string;
    strength?: number;
    [key: string]: unknown;
}
export declare class MongooseAdapter<Result extends Document = Document, Data = Partial<Result>, ServiceParams extends MongooseAdapterParams = MongooseAdapterParams, PatchData = Partial<Data>> extends AdapterBase<Result, Data, PatchData, ServiceParams, MongooseAdapterOptions<Result>> {
    Model: Model<Result>;
    lean: boolean;
    overwrite: boolean;
    discriminatorKey: string;
    discriminators: Record<string, Model<Result>>;
    useEstimatedDocumentCount: boolean;
    constructor(options: MongooseAdapterOptions<Result>);
    get id(): string;
    allowsMulti(method: string, params?: MongooseAdapterParams): boolean;
    _getQueryModifier(params?: MongooseAdapterParams): (modelQuery: Query<any, any>) => Query<any, any, {}, any>;
    private applyPopulate;
    private getModelForParams;
    private applyCollation;
    private checkIdConflict;
    private buildFinalQuery;
    private performOptimizedMultiPatch;
    private performSingleDocumentPatch;
    private performMultiDocumentPatch;
    private applySelect;
    _find(params?: ServiceParams & {
        paginate?: PaginationOptions;
    }): Promise<Paginated<Result>>;
    _find(params?: ServiceParams & {
        paginate: false;
    }): Promise<Result[]>;
    _find(params?: ServiceParams): Promise<Paginated<Result> | Result[]>;
    _get(id: Id, params?: ServiceParams): Promise<Result>;
    _create(data: Data, params?: ServiceParams): Promise<Result>;
    _create(data: Data[], params?: ServiceParams): Promise<Result[]>;
    _create(data: Data | Data[], params?: ServiceParams): Promise<Result | Result[]>;
    _update(id: Id, data: Data, params?: ServiceParams): Promise<Result>;
    _patch(id: null, data: PatchData, params?: ServiceParams): Promise<Result[]>;
    _patch(id: Id, data: PatchData, params?: ServiceParams): Promise<Result>;
    _patch(id: Id | null, data: PatchData, params?: ServiceParams): Promise<Result | Result[]>;
    _remove(id: null, params?: ServiceParams): Promise<Result[]>;
    _remove(id: Id, params?: ServiceParams): Promise<Result>;
    _remove(id: Id | null, params?: ServiceParams): Promise<Result | Result[]>;
}
export {};
//# sourceMappingURL=adapter.d.ts.map