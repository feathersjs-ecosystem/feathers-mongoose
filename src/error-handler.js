import errors from 'feathers-errors';

export default function errorHandler (error) {
  if (error.name) {
    switch (error.name) {
      case 'ValidationError':
      case 'ValidatorError':
      case 'CastError':
      case 'VersionError':
        return Promise.reject(new errors.BadRequest(error));
      case 'OverwriteModelError':
        return Promise.reject(new errors.Conflict(error));
      case 'MissingSchemaError':
      case 'DivergentArrayError':
        return Promise.reject(new errors.GeneralError(error));
      case 'MongoError':
        if (error.code === 11000 || error.code === 11001) {
          // NOTE (EK): Error parsing as discussed in this github thread
          // https://github.com/Automattic/mongoose/issues/2129
          const match1 = error.message.match(/_?([a-zA-Z]*)_?\d?\s*dup key/i);
          const match2 = error.message.match(/\s*dup key:\s*\{\s*:\s*"?(\S+)"?\s*\}/i);

          const key = match1 ? match1[1] : 'path';
          let value = match2 ? match2[1] : 'value';

          if (value === 'null') {
            value = null;
          } else if (value === 'undefined') {
            value = undefined;
          }

          error.message = `${key}: ${value} already exists.`;
          error.errors = {
            [key]: value
          };

          return Promise.reject(new errors.Conflict(error));
        }

        return Promise.reject(new errors.GeneralError(error));
    }
  }

  return Promise.reject(error);
}
