// jshint expr:true

import { expect } from 'chai';
import { base, orm, example } from 'feathers-service-tests';
import errors from 'feathers-errors';
import feathers from 'feathers';
import service from '../src';
import { hooks, Service } from '../src';
import server from './test-app';
import User from './models/user';
import Pet from './models/pet';

const _ids = {};
const _petIds = {};
const app = feathers().use('/people', service({ name: 'User', Model: User }))
                      .use('/pets', service({ name: 'Pet', Model: Pet }))
                      .use('/people2', service({ name: 'User', Model: User, lean: true }))
                      .use('/pets2', service({ name: 'Pet', Model: Pet, lean: true }));
const people = app.service('people');
const pets = app.service('pets');
const leanPeople = app.service('people2');
const leanPets = app.service('pets2');
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

    describe('when missing the overwrite option', () => {
      it('sets the default to be true', () => {
        expect(people.overwrite).to.be.true;
      });
    });

    describe('when missing the lean option', () => {
      it('sets the default to be false', () => {
        expect(people.lean).to.be.false;
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

    it('can $populate with find', function (done) {
      var params = {
        query: {
          name: 'Doug',
          $populate: ['pets']
        }
      };

      people.find(params).then(data => {
        expect(data[0].pets[0].name).to.equal('Rufus');
        done();
      });
    });

    it('can $populate with get', function (done) {
      var params = {
        query: {
          $populate: ['pets']
        }
      };

      people.get(_ids.Doug, params).then(data => {
        expect(data.pets[0].name).to.equal('Rufus');
        done();
      }).catch(done);
    });

    it('can $populate with update', function (done) {
      var params = {
        query: {
          $populate: ['pets']
        }
      };

      people.get(_ids.Doug).then(doug => {
        var newDoug = doug.toObject();
        newDoug.name = 'Bob';

        people.update(_ids.Doug, newDoug, params).then(data => {
          expect(data.name).to.equal('Bob');
          expect(data.pets[0].name).to.equal('Rufus');
          done();
        }).catch(done);
      }).catch(done);
    });

    it('can $populate with patch', function (done) {
      var params = {
        query: {
          $populate: ['pets']
        }
      };

      people.patch(_ids.Doug, { name: 'Bob' }, params).then(data => {
        expect(data.name).to.equal('Bob');
        expect(data.pets[0].name).to.equal('Rufus');
        done();
      }).catch(done);
    });

    it('can $push an item onto an array with update', function(done) {
      pets.create({ type: 'cat', name: 'Margeaux' }).then(margeaux => {
        people.update(_ids.Doug, { $push: { pets: margeaux } })
          .then(() => {
            var params = {
              query: {
                $populate: ['pets']
              }
            };

            people.get(_ids.Doug, params).then(data => {
              expect(data.pets[1].name).to.equal('Margeaux');
              done();
            }).catch(done);
          }).catch(done);
      }).catch(done);
    });

    it('can $push an item onto an array with patch', function(done) {
      pets.create({ type: 'cat', name: 'Margeaux' }).then(margeaux => {
        people.patch(_ids.Doug, { $push: { pets: margeaux } })
          .then(() => {
            var params = {
              query: {
                $populate: ['pets']
              }
            };

            people.get(_ids.Doug, params).then(data => {
              expect(data.pets[1].name).to.equal('Margeaux');
              done();
            }).catch(done);
          }).catch(done);
      }).catch(done);
    });

    it('runs validators on update', function(done) {
      people.create({ name: 'David', age: 33 })
        .then(person => people.update(person._id, { name: 'Dada', age: 'wrong' }))
        .then(() => done(new Error('Update should not be successful')))
        .catch(error => {
          expect(error.name).to.equal('BadRequest');
          expect(error.message).to.equal('Cast to number failed for value "wrong" at path "age"');
          done();
        });
    });

    it('runs validators on patch', function(done) {
      people.create({ name: 'David', age: 33 })
        .then(person => people.patch(person._id, { name: 'Dada', age: 'wrong' }))
        .then(() => done(new Error('Update should not be successful')))
        .catch(error => {
          expect(error.name).to.equal('BadRequest');
          expect(error.message).to.equal('Cast to number failed for value "wrong" at path "age"');
          done();
        });
    });

    it('returns a Conflict when unique index is violated', function(done) {
      pets.create({ type: 'cat', name: 'Bob' })
        .then(() => pets.create({ type: 'cat', name: 'Bob' }))
        .then(() => done(new Error('Should not be successful')))
        .catch(error => {
          expect(error.name).to.equal('Conflict');
          done();
        });
    });
  });

  describe('Lean Services', () => {
    beforeEach((done) => {
      // FIXME (EK): This is shit. We should be loading fixtures
      // using the raw driver not our system under test
      leanPets.create({type: 'dog', name: 'Rufus'}).then(pet => {
        _petIds.Rufus = pet._id;

        return leanPeople.create({ name: 'Doug', age: 32, pets: [pet._id] }).then(user => {
          _ids.Doug = user._id;
          done();
        });
      });
    });

    afterEach(done => {
      leanPets.remove(null, { query: {} }).then(() => {
        return leanPeople.remove(null, { query: {} }).then(() => {
          return done();
        });
      });
    });

    base(leanPeople, _ids, errors, '_id');

    it('can $populate with find', function (done) {
      var params = {
        query: {
          name: 'Doug',
          $populate: ['pets']
        }
      };

      leanPeople.find(params).then(data => {
        expect(data[0].pets[0].name).to.equal('Rufus');
        done();
      });
    });

    it('can $populate with get', function (done) {
      var params = {
        query: {
          $populate: ['pets']
        }
      };

      leanPeople.get(_ids.Doug, params).then(data => {
        expect(data.pets[0].name).to.equal('Rufus');
        done();
      }).catch(done);
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
