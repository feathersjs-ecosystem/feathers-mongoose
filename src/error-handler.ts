import * as errors from '@feathersjs/errors';

export const ERROR = Symbol('feathers-mongoose/error');

interface MongooseError extends Error {
  code?: number;
  path?: string;
  value?: any;
  errors?: Record<string, any>;
}

const wrap = (error: errors.FeathersError, original: MongooseError): errors.FeathersError =>
  Object.assign(error, { [ERROR]: original });

export const errorHandler = (error: MongooseError): Promise<never> => {
  // If it's already a Feathers error, just reject it as is
  if (error instanceof errors.FeathersError) {
    return Promise.reject(error);
  }

  if (error.code === 11000 || error.code === 11001) {
    // NOTE (EK): Error parsing as discussed in this github thread
    // https://github.com/Automattic/mongoose/issues/2129
    const match1 = error.message.match(/_?([a-zA-Z]*)_?\d?\s*dup key/i);
    const match2 = error.message.match(/\s*dup key:\s*\{\s*:\s*"?(.*?)"?\s*\}/i);

    const key = match1 ? match1[1] : 'path';
    let value: any = match2 ? match2[1] : 'value';

    if (value === 'null') {
      value = null;
    } else if (value === 'undefined') {
      value = undefined;
    }

    error.message = `${key}: ${value} already exists.`;
    error.errors = {
      [key]: value
    };

    return Promise.reject(wrap(new errors.Conflict(error), error));
  }

  if (error.name) {
    switch (error.name) {
      case 'ValidationError':
      case 'ValidatorError':
      case 'VersionError':
        return Promise.reject(wrap(new errors.BadRequest(error), error));
      case 'CastError':
        // If CastError is for an ID field (common patterns), treat as NotFound (invalid ID format)
        if (error.path === '_id' || error.path === 'customid' || error.message.includes('_id') || error.message.includes('Cast to ObjectId failed')) {
          return Promise.reject(wrap(new errors.NotFound(`No record found for id '${error.value}'`), error));
        }
        return Promise.reject(wrap(new errors.BadRequest(error), error));
      case 'OverwriteModelError':
        return Promise.reject(wrap(new errors.Conflict(error), error));
      case 'MissingSchemaError':
      case 'DivergentArrayError':
        return Promise.reject(wrap(new errors.GeneralError(error), error));
      case 'MongoError':
        return Promise.reject(wrap(new errors.GeneralError(error), error));
    }
  }

  return Promise.reject(error);
};
