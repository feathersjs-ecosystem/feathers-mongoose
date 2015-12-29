import errors from 'feathers-errors';
import mongoose from 'mongoose';

export function errorHandler(error) {
  let feathersError = error;

  console.error('ERROR', error);

  if (error.constructor.name && (error.constructor.name === 'WLValidationError' || error.constructor.name === 'WLUsageError' )) {
    let e = error.toJSON();
    let data = Object.assign({ errors: error.errors}, e);

    feathersError = new errors.BadRequest(e.summary, data);
  }
  else if (error.message) {
    switch(error.message) {
      case mongoose.errors.ValidationError.toString():
        feathersError = new errors.BadRequest(error);
        break;
    }
  }

  throw feathersError;
}
