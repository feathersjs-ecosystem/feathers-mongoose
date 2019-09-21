// TypeScript Version: 3.0
import { Params, Paginated, Id, NullableId, Hook } from '@feathersjs/feathers';
import { AdapterService, ServiceOptions, InternalServiceMethods } from '@feathersjs/adapter-commons';
import { Model } from 'mongoose';

export namespace hooks {
  function toObject(options?: any, dataField?: string): Hook;
}

export namespace transactionManager {
  const beginTransaction: Hook;
  const commitTransaction: Hook;
  const rollbackTransaction: Hook;
}

export interface MongooseServiceOptions extends ServiceOptions {
  Model: Model<any>;
  lean: boolean;
  overwrite: boolean;
  useEstimatedDocumentCount: boolean;
}

export class Service<T = any> extends AdapterService<T> implements InternalServiceMethods<T> {
  Model: Model<any>;
  options: MongooseServiceOptions;

  constructor(config?: Partial<MongooseServiceOptions>);

  _find(params?: Params): Promise<T | T[] | Paginated<T>>;
  _get(id: Id, params?: Params): Promise<T>;
  _create(data: Partial<T> | Array<Partial<T>>, params?: Params): Promise<T | T[]>;
  _update(id: NullableId, data: T, params?: Params): Promise<T>;
  _patch(id: NullableId, data: Partial<T>, params?: Params): Promise<T>;
  _remove(id: NullableId, params?: Params): Promise<T>;
}

declare const mongoose: ((config?: Partial<MongooseServiceOptions>) => Service);
export default mongoose;
