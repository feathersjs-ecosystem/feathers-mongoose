import { AdapterBase, AdapterParams, AdapterServiceOptions } from '@feathersjs/adapter-commons';
import { Model, Query, PopulateOptions, ClientSession } from 'mongoose';
import { Id } from '@feathersjs/feathers';
export interface MongooseAdapterOptions extends AdapterServiceOptions {
    Model: Model<any>;
    lean?: boolean;
    overwrite?: boolean;
    discriminators?: Model<any>[];
    useEstimatedDocumentCount?: boolean;
    queryModifier?: (query: Query<any, any>) => void;
}
export interface MongooseAdapterParams extends AdapterParams {
    mongoose?: {
        session?: ClientSession;
        upsert?: boolean;
        writeResult?: boolean;
    };
    query?: {
        $populate?: PopulateOptions | PopulateOptions[];
        [key: string]: any;
    };
    queryModifier?: ((query: Query<any, any>) => void) | false;
    collation?: MongooseCollation;
}
export type AdapterId = Id;
export type NullableAdapterId = AdapterId | null;
interface MongooseCollation {
    locale: string;
    strength?: number;
    [key: string]: any;
}
export declare class MongooseAdapter<Result = any, Data = Partial<Result>, ServiceParams extends MongooseAdapterParams = MongooseAdapterParams, PatchData = Partial<Data>> extends AdapterBase<Result, Data, PatchData, ServiceParams, MongooseAdapterOptions> {
    Model: Model<any>;
    lean: boolean;
    overwrite: boolean;
    discriminatorKey: string;
    discriminators: Record<string, Model<any>>;
    useEstimatedDocumentCount: boolean;
    constructor(options: MongooseAdapterOptions);
    get id(): string;
    allowsMulti(method: string, params?: MongooseAdapterParams): boolean;
    _getQueryModifier(params?: MongooseAdapterParams): (modelQuery: Query<any, any>) => Query<any, any, {}, any>;
    private getModelForParams;
    private applyCollation;
    private checkIdConflict;
    private buildFinalQuery;
    private performSingleDocumentPatch;
    private performMultiDocumentPatch;
    private applySelect;
    _find(params?: MongooseAdapterParams): Promise<any>;
    _get(id: any, params?: MongooseAdapterParams): Promise<any>;
    _create(data: any, params?: MongooseAdapterParams): Promise<any>;
    _update(id: any, data: any, params?: MongooseAdapterParams): Promise<any>;
    _patch(id: any, data: any, params?: MongooseAdapterParams): Promise<any>;
    _remove(id: any, params?: MongooseAdapterParams): Promise<any>;
    private _getOrFind;
}
export {};
//# sourceMappingURL=adapter.d.ts.map