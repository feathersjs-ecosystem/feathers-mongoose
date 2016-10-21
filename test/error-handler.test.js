import 'feathers';
import { expect } from 'chai';
import mongoose from 'mongoose';
import errors from 'feathers-errors';
import errorHandler from '../src/error-handler';

describe('Feathers Mongoose Error Handler', () => {
  it('throws a feathers error', done => {
    let e = new errors.GeneralError();
    errorHandler(e).catch(error => {
      expect(error).to.be.an.instanceof(errors.GeneralError);
      done();
    }).catch(done);
  });

  it('wraps a ValidationError as a BadRequest', done => {
    let e = new mongoose.Error.ValidationError();
    errorHandler(e).catch(error => {
      expect(error).to.be.an.instanceof(errors.BadRequest);
      done();
    }).catch(done);
  });

  it('preserves a validation error message', done => {
    let e = new mongoose.Error.ValidationError();
    e.message = 'Invalid Email';

    errorHandler(e).catch(error => {
      expect(error.message).to.equal('Invalid Email');
      done();
    }).catch(done);
  });

  it('preserves a validation errors', done => {
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

    errorHandler(e).catch(error => {
      expect(error.errors).to.deep.equal(emailError);
      done();
    }).catch(done);
  });

  it('wraps a ValidatorError as a BadRequest', done => {
    let e = new mongoose.Error.ValidatorError({message: 'error'});

    errorHandler(e).catch(error => {
      expect(error).to.be.an.instanceof(errors.BadRequest);
      done();
    }).catch(done);
  });

  it('wraps a CastError as a BadRequest', done => {
    let e = new mongoose.Error.CastError();
    errorHandler(e).catch(error => {
      expect(error).to.be.an.instanceof(errors.BadRequest);
      done();
    }).catch(done);
  });

  it('wraps a VersionError as a BadRequest', done => {
    let e = new mongoose.Error.VersionError({ _id: 'testing' });
    errorHandler(e).catch(error => {
      expect(error).to.be.an.instanceof(errors.BadRequest);
      done();
    }).catch(done);
  });

  it('wraps a OverwriteModelError as a Conflict', done => {
    let e = new mongoose.Error.OverwriteModelError();
    errorHandler(e).catch(error => {
      expect(error).to.be.an.instanceof(errors.Conflict);
      done();
    }).catch(done);
  });

  it('wraps a MissingSchemaError as a GeneralError', done => {
    let e = new mongoose.Error.MissingSchemaError();
    errorHandler(e).catch(error => {
      expect(error).to.be.an.instanceof(errors.GeneralError);
      done();
    }).catch(done);
  });

  it('wraps a DivergentArrayError as a GeneralError', done => {
    let fn = function () {};
    let e = new mongoose.Error.DivergentArrayError({join: fn});
    errorHandler(e).catch(error => {
      expect(error).to.be.an.instanceof(errors.GeneralError);
      done();
    }).catch(done);
  });

  it('wraps a DuplicateKey error as a Conflict', done => {
    let e = Error('Mock Duplicate Key Error');
    e.name = 'MongoError';
    e.code = 11000;
    errorHandler(e).catch(error => {
      expect(error).to.be.an.instanceof(errors.Conflict);
      done();
    }).catch(done);
  });
});
