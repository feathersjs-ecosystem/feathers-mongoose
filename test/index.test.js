/* eslint-disable no-unused-expressions */

import { expect } from 'chai';
import { base, example } from 'feathers-service-tests';
import errors from 'feathers-errors';
import feathers from 'feathers';
import service, { hooks, Service } from '../src';
import server from './test-app';
import { User, Pet, Peeps, CustomPeeps, Post, TextPost } from './models';

const _ids = {};
const _petIds = {};
const app = feathers()
  .use('/peeps', service({ Model: Peeps, events: [ 'testing' ] }))
  .use('/peeps-customid', service({
    id: 'customid',
    Model: CustomPeeps,
    events: [ 'testing' ]
  }))
  .use('/people', service({ Model: User, lean: false }))
  .use('/pets', service({ Model: Pet, lean: false }))
  .use('/people2', service({ Model: User }))
  .use('/pets2', service({ Model: Pet }))
  .use('/posts', service({ Model: Post, discriminators: [TextPost] }));
const people = app.service('people');
const pets = app.service('pets');
const leanPeople = app.service('people2');
const leanPets = app.service('pets2');
const posts = app.service('posts');

const sortAge = (items) => {
  if (Array.isArray(items[1])) {
    // Order is not guaranteed so lets just order by age
    items[1] = items[1].sort((a, b) => {
      return a.age > b.age;
    });
  }
  return items;
};

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
      let newService;
      try {
        newService = new Service();
      } catch (e) {
        expect(e).to.not.be.undefined;
        expect(newService).to.be.undefined;
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

  describe('insertMany', () => {
    afterEach(() => {
      return people.remove(null, { query: {} });
    });

    it('can return all validation errors', function () {
      return people.create([
        {
          name: 'David',
          age: 10
        },
        {
          name: 'Peter',
          age: -6
        },
        {
          age: 7
        },
        {
          name: 'Christopher',
          age: 5
        }
      ])
      .then(sortAge)
      .then(result => {
        let [errors, users] = result.data;
        expect(users).to.be.an('array');
        let validationErrors = errors.filter(error => Object.keys(error)[0] === 'ValidationError');
        expect(validationErrors.length).to.equal(2);
        expect(users[0].name).to.equal('David');
      });
    });

    it('can return duplicate key errors', function (done) {
      people.create([
        {
          name: 'David',
          age: 10
        }
      ])
      .then(user => {
        _ids.David = user.data[1][0]._id;
        people.create([
          {
            _id: _ids.David,
            name: 'Matt',
            age: 20
          }
        ])
        .then(result => {
          let [errors, users] = result.data;
          expect(Object.keys(errors[0])[0]).to.equal('WriteError');
          expect(users).to.be.null;
          done();
        })
        .catch(done);
      })
      .catch(done);
    });

    it('can return combination of duplicate key and validation errors', function (done) {
      people.create([
        {
          name: 'David',
          age: 10
        }
      ])
      .then(person => {
        _ids.David = person.data[1][0]._id;
        people.create([
          {
            _id: _ids.David,
            name: 'David',
            age: 20
          },
          {
            age: 20
          },
          {
            name: 'Peter',
            age: 27
          }
        ])
        .then(sortAge)
        .then(result => {
          let [errors, users] = result.data;
          let validationErrors = errors.filter(error => Object.keys(error)[0] === 'ValidationError');
          let writeErrors = errors.filter(error => Object.keys(error)[0] === 'WriteError');
          expect(validationErrors.length).to.equal(1);
          expect(writeErrors.length).to.equal(1);
          expect(users.length).to.equal(1);
          done();
        })
        .catch(done);
      })
      .catch(done);
    });

    it('can create with array', function (done) {
      people.create([
        {
          name: 'David',
          age: 10
        },
        {
          name: 'Peter',
          age: 27
        }
      ])
      .then(sortAge)
      .then(result => {
        let [errors, users] = result.data;
        expect(errors).to.be.null;
        expect(users.length).to.equal(2);
        expect(users[0].name).to.equal('David');
        expect(users[1].name).to.equal('Peter');
        done();
      })
      .catch(done);
    });
  });

  describe('Common functionality', () => {
    beforeEach(() => {
      // FIXME (EK): This is shit. We should be loading fixtures
      // using the raw driver not our system under test
      return pets.create({type: 'dog', name: 'Rufus', gender: 'Unknown'}).then(pet => {
        _petIds.Rufus = pet._id;

        return people.create({
          name: 'Doug',
          age: 32,
          pets: [pet._id]
        }).then(user => {
          _ids.Doug = user._id;
        });
      });
    });

    afterEach(() => {
      return pets.remove(null, { query: {} }).then(() =>
        people.remove(null, { query: {} })
      );
    });

    it('can $select with a String', function (done) {
      var params = {
        query: {
          name: 'Rufus',
          $select: '+gender'
        }
      };

      pets.find(params).then(data => {
        expect(data[0].gender).to.equal('Unknown');
        done();
      });
    });

    it('can $select with an Array', function (done) {
      var params = {
        query: {
          name: 'Rufus',
          $select: ['gender']
        }
      };

      pets.find(params).then(data => {
        expect(data[0].gender).to.equal('Unknown');
        done();
      });
    });

    it('can $select with an Object', function (done) {
      var params = {
        query: {
          name: 'Rufus',
          $select: {'gender': true}
        }
      };

      pets.find(params).then(data => {
        expect(data[0].gender).to.equal('Unknown');
        done();
      });
    });

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

    it('can patch a mongoose model', function (done) {
      people.get(_ids.Doug).then(dougModel => {
        people.patch(_ids.Doug, dougModel).then(data => {
          expect(data.name).to.equal('Doug');
          done();
        }).catch(done);
      }).catch(done);
    });

    it('can patch a mongoose model', function (done) {
      people.get(_ids.Doug).then(dougModel => {
        people.update(_ids.Doug, dougModel).then(data => {
          expect(data.name).to.equal('Doug');
          done();
        }).catch(done);
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

    it('can $push an item onto an array with update', function (done) {
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

    it('can $push an item onto an array with patch', function (done) {
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

    it('runs validators on update', function () {
      return people.create({ name: 'David', age: 33 })
        .then(person => people.update(person._id, { name: 'Dada', age: 'wrong' }))
        .then(() => {
          throw new Error('Update should not be successful');
        })
        .catch(error => {
          expect(error.name).to.equal('BadRequest');
          expect(error.message).to.equal('User validation failed: age: Cast to Number failed for value "wrong" at path "age"');
        });
    });

    it('runs validators on patch', function (done) {
      people.create({ name: 'David', age: 33 })
        .then(person => people.patch(person._id, { name: 'Dada', age: 'wrong' }))
        .then(() => done(new Error('Update should not be successful')))
        .catch(error => {
          expect(error.name).to.equal('BadRequest');
          expect(error.message).to.equal('Cast to number failed for value "wrong" at path "age"');
          done();
        });
    });

    it('returns a Conflict when unique index is violated', function (done) {
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

  describe('Discriminators', () => {
    const data = {
      _type: 'text',
      text: 'Feathers!!!'
    };

    afterEach(done => {
      posts.remove(null, { query: {} })
      .then(data => {
        done();
      });
    });

    it('can get a discriminated model', function (done) {
      posts.create(data)
      .then(data => posts.get(data._id))
      .then(data => {
        expect(data._type).to.equal('text');
        expect(data.text).to.equal('Feathers!!!');
        done();
      });
    });

    it('can find discriminated models by the type', function (done) {
      posts.create(data)
      .then(data => posts.find({ query: { _type: 'text' } }))
      .then(data => {
        data.forEach(element => {
          expect(element._type).to.equal('text');
        });
        done();
      });
    });

    it('can create a discriminated model', function (done) {
      posts.create(data)
      .then(data => {
        expect(data._type).to.equal('text');
        expect(data.text).to.equal('Feathers!!!');
        done();
      });
    });

    it('can update a discriminated model', function (done) {
      const update = {
        _type: 'text',
        text: 'Hello, world!',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const params = {
        query: {
          _type: 'text'
        }
      };
      posts.create(data)
      .then(data => posts.update(data._id, update, params))
      .then(data => {
        expect(data._type).to.equal('text');
        expect(data.text).to.equal('Hello, world!');
        done();
      });
    });

    it('can patch a discriminated model', function (done) {
      const update = {
        text: 'Howdy folks!'
      };
      const params = {
        query: {
          _type: 'text'
        }
      };
      posts.create(data)
      .then(data => posts.patch(data._id, update, params))
      .then(data => {
        expect(data.text).to.equal('Howdy folks!');
        done();
      });
    });

    it('can remove a discriminated model', function (done) {
      posts.create(data)
      .then(data => posts.remove(data._id, { query: { _type: 'text' } }))
      .then(data => {
        expect(data._type).to.equal('text');
        done();
      });
    });
  });

  describe('Common tests', () => {
    before(() => Promise.all([
      app.service('peeps').remove(null),
      app.service('peeps-customid').remove(null)
    ]));

    base(app, errors, 'peeps', '_id');
    base(app, errors, 'peeps-customid', 'customid');
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
