import { PaginationOptions } from '@feathersjs/adapter-commons';
import { MethodNotAllowed } from '@feathersjs/errors';
import { Paginated, Params } from '@feathersjs/feathers';
import { MongooseAdapter, MongooseAdapterOptions, MongooseAdapterParams, AdapterId, NullableAdapterId } from './adapter';

export class MongooseService<
  Result = any,
  Data = Partial<Result>,
  ServiceParams extends Params<any> = MongooseAdapterParams,
  PatchData = Partial<Data>
> extends MongooseAdapter<Result, Data, ServiceParams, PatchData> {
  async find(params?: ServiceParams & { paginate?: PaginationOptions }): Promise<Paginated<Result>>
  async find(params?: ServiceParams & { paginate: false }): Promise<Result[]>
  async find(params?: ServiceParams): Promise<Paginated<Result> | Result[]>
  async find(params?: ServiceParams): Promise<Paginated<Result> | Result[]> {
    return this._find(params);
  }

  async get(id: AdapterId, params?: ServiceParams): Promise<Result> {
    return this._get(id, params);
  }

  async create(data: Data, params?: ServiceParams): Promise<Result>
  async create(data: Data[], params?: ServiceParams): Promise<Result[]>
  async create(data: Data | Data[], params?: ServiceParams): Promise<Result | Result[]>
  async create(data: Data | Data[], params?: ServiceParams): Promise<Result | Result[]> {
    if (Array.isArray(data) && !this.allowsMulti('create', params)) {
      return Promise.reject(new MethodNotAllowed('Can not create multiple entries. Set `multi: ["create"]` or `multi: true` in service options to allow multi-create. Alternatively, pass `params.adapter.multi` to allow multi-create for this request.'));
    }

    return this._create(data, params);
  }

  async update(id: AdapterId, data: Data, params?: ServiceParams): Promise<Result> {
    return this._update(id, data, params);
  }

  async patch(id: null, data: PatchData, params?: ServiceParams): Promise<Result[]>
  async patch(id: AdapterId, data: PatchData, params?: ServiceParams): Promise<Result>
  async patch(id: NullableAdapterId, data: PatchData, params?: ServiceParams): Promise<Result | Result[]>
  async patch(id: NullableAdapterId, data: PatchData, params?: ServiceParams): Promise<Result | Result[]> {
    return this._patch(id, data, params);
  }

  async remove(id: AdapterId, params?: ServiceParams): Promise<Result>
  async remove(id: null, params?: ServiceParams): Promise<Result[]>
  async remove(id: NullableAdapterId, params?: ServiceParams): Promise<Result | Result[]>
  async remove(id: NullableAdapterId, params?: ServiceParams): Promise<Result | Result[]> {
    return this._remove(id, params);
  }
}

export default function init(options: MongooseAdapterOptions): MongooseService {
  return new MongooseService(options);
}

export { MongooseAdapter, MongooseAdapterOptions, MongooseAdapterParams };
