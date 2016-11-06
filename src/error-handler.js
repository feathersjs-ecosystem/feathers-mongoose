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
        if (error.code === 11000) {
          return Promise.reject(new errors.Conflict(error));
        }

        return Promise.rejct(new errors.GeneralError(error));
    }
  }

  return Promise.reject(error);
}
