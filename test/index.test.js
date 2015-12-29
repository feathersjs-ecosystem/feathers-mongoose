// jshint expr:true

import { expect } from 'chai';
import { base, orm, example } from 'feathers-service-tests';
import errors from 'feathers-errors';
import feathers from 'feathers';
import {hooks, service, mongoose} from '../src';
import server from '../example/app';

const Model = {
  schema: {
    name: {type: String, required: true},
    age: {type: Number},
    created: {type: Boolean, 'default': false},
    time: {type: Date, 'default': Date.now}
  },
  before:{
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },
  after:{
    all: [],
    find: [hooks.toObject()],
    get: [],
    create: [hooks.toObject()],
    update: [],
    patch: [],
    remove: []
  }
};

const _ids = {};
const app = feathers().use('/people', service({ name: 'user', Model }));
const people = app.service('people');

describe('Feathers Mongoose Service', () => {
  describe('Requiring', () => {
    it('exposes the service as a default module', () => {
      expect(typeof require('../lib').default).to.equal('function');
    });

    it('exposes the service', () => {
      expect(typeof require('../lib').service).to.equal('function');
    });

    it('exposes hooks', () => {
      expect(typeof require('../lib').hooks).to.equal('object');
    });

    it('exposes mongoose', () => {
      expect(typeof require('../lib').mongoose).to.equal('object');
    });
  });

  describe('Initialization', () => {
    describe('when missing options', () => {
      it('throws an error', () => {
        let e = new Error('Mongoose options have to be provided');
        expect(service.bind(null)).to.throw(e);
      });
    });

    describe('when missing a model name', () => {
      it('throws an error', () => {
        let e = new Error('A valid model name must be provided');
        expect(service.bind(null)).to.throw(e);
      });
    });

    describe('when missing a Model', () => {
      it('throws an error', () => {
        expect(service.bind(null)).to.throw(/You must provide a Model/);
      });
    });

    describe('when missing the id option', () => {
      it('sets the default to be _id', () => {
        expect(people.id).to.equal('_id');
      });
    });

    describe('when missing the paginate option', () => {
      it('sets the default to be {}', () => {
        expect(people.paginate).to.equal({});
      });
    });
  });

  describe.only('Common functionality', () => {
    beforeEach(() => {
      mongoose.models = {};
      mongoose.modelSchemas = {};
      mongoose.connection.models = {};
      mongoose.connection.collections = {};
    });

    base(people, _ids, errors);
  });

  describe('Mongoose service ORM errors', () => {
    orm(people, _ids, errors);
  });

  describe('Mongoose service example test', () => {
    after(done => server.close(() => done()));

    example();
  });
});
