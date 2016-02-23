import errors from 'feathers-errors';

export default function errorHandler(error) {
  let feathersError = error;

  if (error.constructor.name === 'MongooseError' && error.name) {
    switch(error.name) {
      case 'ValidationError':
      case 'ValidatorError':
      case 'CastError':
      case 'VersionError':
        feathersError = new errors.BadRequest(error);
        break;
      case 'OverwriteModelError':
        feathersError = new errors.Conflict(error);
        break;
      case 'MissingSchemaError':
      case 'DivergentArrayError':
        feathersError = new errors.GeneralError(error);
        break;
    }
  }

  return Promise.reject(feathersError);
}
