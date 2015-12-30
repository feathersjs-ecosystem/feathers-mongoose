import { expect } from 'chai';
import mongoose from 'mongoose';
import errors from 'feathers-errors';
import errorHandler from '../src/error-handler';

describe('Feathers Mongoose Error Handler', () => {
  it('throws a feathers error', () => {
    let e = new errors.GeneralError();
    expect(errorHandler.bind(null, e)).to.throw(errors.GeneralError);
  });

  it('wraps a ValidationError as a BadRequest', () => {
    let e = new mongoose.Error.ValidationError();
    expect(errorHandler.bind(null, e)).to.throw(errors.BadRequest);
  });

  it('preserves a validation error message', () => {
    let e = new mongoose.Error.ValidationError();
    e.message = 'Invalid Email';

    try {
      errorHandler(e);
    }
    catch(error) {
      expect(error.message).to.equal('Invalid Email');
    }
  });

  it('preserves a validation errors', () => {
    let emailError = {
      email: {
        message: 'email cannot be null',
        type: 'notNull Violation',
        path: 'email',
        value: null
      }
    };

    let e = new mongoose.Error.ValidationError();
    e.errors = emailError;

    try {
      errorHandler(e);
    }
    catch(error) {
      expect(error.errors).to.deep.equal(emailError);
    }
  });

  it('wraps a ValidatorError as a BadRequest', () => {
    let e = new mongoose.Error.ValidatorError({message: 'error'});
    expect(errorHandler.bind(null, e)).to.throw(errors.BadRequest);
  });

  it('wraps a CastError as a BadRequest', () => {
    let e = new mongoose.Error.CastError();
    expect(errorHandler.bind(null, e)).to.throw(errors.BadRequest);
  });

  it('wraps a VersionError as a BadRequest', () => {
    let e = new mongoose.Error.VersionError();
    expect(errorHandler.bind(null, e)).to.throw(errors.BadRequest);
  });

  it('wraps a OverwriteModelError as a Conflict', () => {
    let e = new mongoose.Error.OverwriteModelError();
    expect(errorHandler.bind(null, e)).to.throw(errors.Conflict);
  });

  it('wraps a MissingSchemaError as a GeneralError', () => {
    let e = new mongoose.Error.MissingSchemaError();
    expect(errorHandler.bind(null, e)).to.throw(errors.GeneralError);
  });

  it('wraps a DivergentArrayError as a GeneralError', () => {
    let fn = function(){};
    let e = new mongoose.Error.DivergentArrayError({join: fn});
    expect(errorHandler.bind(null, e)).to.throw(errors.GeneralError);
  });
});