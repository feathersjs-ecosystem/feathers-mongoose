// TypeScript Version: 4.0
import { Params, Paginated, Id, NullableId, Hook } from '@feathersjs/feathers';
import { AdapterService, ServiceOptions, InternalServiceMethods } from '@feathersjs/adapter-commons';
import { Model, Document, Query, ClientSession, PopulateOptions } from 'mongoose';

export namespace hooks {
  function toObject(options?: {
    transform?: (doc: Document, ret: Record<string, unknown>) => Record<string, unknown>;
  }, dataField?: string): Hook;
}

export namespace transactionManager {
  const beginTransaction: Hook;
  const commitTransaction: Hook;
  const rollbackTransaction: Hook;
}

export interface MongooseServiceOptions<T extends Document = Document> extends ServiceOptions {
  Model: Model<T>;
  lean?: boolean;
  overwrite?: boolean;
  discriminators?: Model<T>[];
  useEstimatedDocumentCount?: boolean;
  queryModifier?: (query: Query<T, T>) => void;
}

export interface MongooseParams extends Params {
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
}

export class Service<T = Document> extends AdapterService<T> implements InternalServiceMethods<T> {
  Model: Model<T>;
  options: MongooseServiceOptions<T>;

  constructor(config?: Partial<MongooseServiceOptions<T>>);

  _find(params?: MongooseParams): Promise<T[] | Paginated<T>>;
  _get(id: Id, params?: MongooseParams): Promise<T>;
  _create(data: Partial<T> | Array<Partial<T>>, params?: MongooseParams): Promise<T | T[]>;
  _update(id: Id, data: Partial<T>, params?: MongooseParams): Promise<T>;
  _patch(id: NullableId, data: Partial<T>, params?: MongooseParams): Promise<T | T[]>;
  _remove(id: NullableId, params?: MongooseParams): Promise<T | T[]>;
}

declare const mongoose: (<T extends Document = Document>(config?: Partial<MongooseServiceOptions<T>>) => Service<T>);
export default mongoose;
