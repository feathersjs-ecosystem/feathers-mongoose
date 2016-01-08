// jshint expr:true

import { expect } from 'chai';
import { base, orm, example } from 'feathers-service-tests';
import errors from 'feathers-errors';
import feathers from 'feathers';
import service from '../src';
import { hooks, Service } from '../src';
import server from '../example/app';
import User from './models/user';
import Pet from './models/pet';

const _ids = {};
const _petIds = {};
const app = feathers().use('/people', service({ name: 'User', Model: User }))
                      .use('/pets', service({ name: 'User', Model: Pet }));
const people = app.service('people');
const pets = app.service('pets');
let testApp;

describe('Feathers Mongoose Service', () => {
  describe('Requiring', () => {
    const lib = require('../lib');

    it('exposes the service as a default module', () => {
      expect(typeof lib).to.equal('function');
    });

    it('exposes the Service Constructor', () => {
      expect(typeof lib.Service).to.equal('function');
    });

    it('exposes hooks', () => {
      expect(typeof lib.hooks).to.equal('object');
    });
  });

  describe('Importing', () => {
    it('exposes the service as a default module', () => {
      expect(typeof service).to.equal('function');
    });

    it('exposes the Service constructor', () => {
      // Check by calling the Service constructor without
      // any params. It should return an error.
      try {
        new Service();
      }
      catch(e) {
        expect(e).to.not.be.undefined; 
      }
    });

    it('exposes hooks', () => {
      expect(typeof hooks).to.equal('object');
    });
  });

  describe('Initialization', () => {
    describe('when missing options', () => {
      it('throws an error', () => {
        expect(service.bind(null)).to.throw('Mongoose options have to be provided');
      });
    });

    describe('when missing a Model', () => {
      it('throws an error', () => {
        expect(service.bind(null, { name: 'Test' })).to.throw(/You must provide a Mongoose Model/);
      });
    });

    describe('when missing the id option', () => {
      it('sets the default to be _id', () => {
        expect(people.id).to.equal('_id');
      });
    });

    describe('when missing the paginate option', () => {
      it('sets the default to be {}', () => {
        expect(people.paginate).to.deep.equal({});
      });
    });
  });

  describe('Common functionality', () => {
    beforeEach((done) => {
      // FIXME (EK): This is shit. We should be loading fixtures
      // using the raw driver not our system under test
      pets.create({type: 'dog', name: 'Rufus'}).then(pet => {
        _petIds.Rufus = pet._id;

        return people.create({ name: 'Doug', age: 32, pets: [pet._id] }).then(user => {
          _ids.Doug = user._id;
          done();
        });
      });
    });

    afterEach(done => {
      pets.remove(null, { query: {} }).then(() => {
        return people.remove(null, { query: {} }).then(() => {
          return done();
        });
      });
    });

    base(people, _ids, errors, '_id');

    it('can $populate', function (done) {
      var params = {
        query: {
          name: 'Doug',
          $populate: ['pets']
        }
      };

      people.find(params).then(data => {
        expect(data[0].pets[0].name).to.equal('Rufus');
        done();
      }).catch(e => {
        console.log(e);
        done();
      });
    });
  });

  describe('Mongoose service ORM errors', () => {
    orm(people, _ids, errors);
  });

  describe('Mongoose service example test', () => {
    before(done => {
      server.service('todos').remove(null, {}).then(() => {
        testApp = server.listen(3030);
        return done();
      });
    });

    after(done => testApp.close(() => done()));

    example('_id');
  });
});
