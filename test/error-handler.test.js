/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const mongoose = require('mongoose');
const errors = require('@feathersjs/errors');

const errorHandler = require('../lib/error-handler');

describe('Feathers Mongoose Error Handler', () => {
  it('throws a feathers error', done => {
    let e = new errors.GeneralError();
    errorHandler(e).catch(error => {
      expect(error).to.be.an.instanceof(errors.GeneralError);
      done();
    }).catch(done);
  });

  it('wraps a ValidationError as a BadRequest', done => {
    let e = new errors.GeneralError();

    e.name = 'ValidationError';
    e.errors = {};

    errorHandler(e).catch(error => {
      expect(error).to.be.an.instanceof(errors.BadRequest);
      done();
    }).catch(done);
  });

  it('preserves a validation error message', done => {
    let e = new errors.GeneralError();

    e.name = 'ValidationError';
    e.errors = {};
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

    let e = new errors.GeneralError();

    e.name = 'ValidationError';
    e.errors = {};
    e.errors = emailError;

    errorHandler(e).catch(error => {
      expect(error.errors).to.deep.equal(emailError);
      done();
    }).catch(done);
  });

  it('wraps a ValidatorError as a BadRequest', done => {
    let e = new errors.GeneralError();

    e.name = 'ValidationError';
    e.errors = {};

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
    let e = new mongoose.Error.VersionError({ _id: 'testing' }, null, []);
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

  describe('DuplicateKey error', () => {
    it('gets wrapped as a Conflict error', done => {
      let e = Error('E11000 duplicate key error collection: db.users index: name_1 dup key: { : "Kate" }');
      e.name = 'MongoError';
      e.code = 11000;
      errorHandler(e).catch(error => {
        expect(error).to.be.an.instanceof(errors.Conflict);
        done();
      }).catch(done);
    });

    it('has the correct error message #1', done => {
      let e = Error('E11000 duplicate key error collection: db.users index: name_1 dup key: { : "Kate" }');
      e.name = 'MongoError';
      e.code = 11000;
      errorHandler(e).catch(error => {
        expect(error.message).to.equal(`name: Kate already exists.`);
        done();
      }).catch(done);
    });

    it('has the correct error message #2', done => {
      let e = Error("E11000 duplicate key error index: myDb.myCollection.$id dup key: { : ObjectId('57226808ec55240c00000272') }");
      e.name = 'MongoError';
      e.code = 11000;
      errorHandler(e).catch(error => {
        expect(error.message).to.equal(`id: ObjectId('57226808ec55240c00000272') already exists.`);
        done();
      }).catch(done);
    });

    it('has the correct errors object #1', done => {
      let e = Error('E11000 duplicate key error index: test.collection.$a.b_1 dup key: { : null }');
      e.name = 'MongoError';
      e.code = 11000;
      errorHandler(e).catch(error => {
        expect(error.errors).to.deep.equal({ b: null });
        done();
      }).catch(done);
    });

    it('has the correct errors object #2', done => {
      let e = Error('E11000 duplicate key error collection: db.users index: name_1 dup key: { : "Kate" }');
      e.name = 'MongoError';
      e.code = 11000;
      errorHandler(e).catch(error => {
        expect(error.errors).to.deep.equal({ name: 'Kate' });
        done();
      }).catch(done);
    });
  });
});
