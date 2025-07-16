import { PaginationOptions } from '@feathersjs/adapter-commons';
import { Paginated, Params } from '@feathersjs/feathers';
import { MongooseAdapter, MongooseAdapterOptions, MongooseAdapterParams, AdapterId, NullableAdapterId } from './adapter';
export declare class MongooseService<Result = any, Data = Partial<Result>, ServiceParams extends Params<any> = MongooseAdapterParams, PatchData = Partial<Data>> extends MongooseAdapter<Result, Data, ServiceParams, PatchData> {
    find(params?: ServiceParams & {
        paginate?: PaginationOptions;
    }): Promise<Paginated<Result>>;
    find(params?: ServiceParams & {
        paginate: false;
    }): Promise<Result[]>;
    find(params?: ServiceParams): Promise<Paginated<Result> | Result[]>;
    get(id: AdapterId, params?: ServiceParams): Promise<Result>;
    create(data: Data, params?: ServiceParams): Promise<Result>;
    create(data: Data[], params?: ServiceParams): Promise<Result[]>;
    create(data: Data | Data[], params?: ServiceParams): Promise<Result | Result[]>;
    update(id: AdapterId, data: Data, params?: ServiceParams): Promise<Result>;
    patch(id: null, data: PatchData, params?: ServiceParams): Promise<Result[]>;
    patch(id: AdapterId, data: PatchData, params?: ServiceParams): Promise<Result>;
    patch(id: NullableAdapterId, data: PatchData, params?: ServiceParams): Promise<Result | Result[]>;
    remove(id: AdapterId, params?: ServiceParams): Promise<Result>;
    remove(id: null, params?: ServiceParams): Promise<Result[]>;
    remove(id: NullableAdapterId, params?: ServiceParams): Promise<Result | Result[]>;
}
export default function init(options: MongooseAdapterOptions): MongooseService;
export { MongooseAdapter, MongooseAdapterOptions, MongooseAdapterParams };
//# sourceMappingURL=service.d.ts.map