/* eslint-disable no-unused-expressions */
const { expect } = require('chai');
const mongoose = require('mongoose');

const errors = require('@feathersjs/errors');
const feathers = require('@feathersjs/feathers');
const adaptersTests = require('@feathersjs/adapter-tests');

const adapter = require('../lib');
const testSuite = adaptersTests([
  '.options',
  '.events',
  '._get',
  '._find',
  '._create',
  '._update',
  '._patch',
  '._remove',
  '.get',
  '.get + $select',
  '.get + id + query',
  '.get + NotFound',
  '.find',
  '.remove',
  '.remove + $select',
  '.remove + id + query',
  '.remove + multi',
  '.update',
  '.update + $select',
  '.update + id + query',
  '.update + NotFound',
  '.patch',
  '.patch + $select',
  '.patch + id + query',
  '.patch multiple',
  '.patch multi query',
  '.patch + NotFound',
  '.create',
  '.create + $select',
  '.create multi',
  'internal .find',
  'internal .get',
  'internal .create',
  'internal .update',
  'internal .patch',
  'internal .remove',
  '.find + equal',
  '.find + equal multiple',
  '.find + $sort',
  '.find + $sort + string',
  '.find + $limit',
  '.find + $limit 0',
  '.find + $skip',
  '.find + $select',
  '.find + $or',
  '.find + $in',
  '.find + $nin',
  '.find + $lt',
  '.find + $lte',
  '.find + $gt',
  '.find + $gte',
  '.find + $ne',
  '.find + $gt + $lt + $sort',
  '.find + $or nested + $sort',
  '.find + paginate',
  '.find + paginate + $limit + $skip',
  '.find + paginate + $limit 0',
  '.find + paginate + params',
  '.get + id + query id',
  '.remove + id + query id',
  '.update + id + query id',
  '.patch + id + query id'
]);

const {
  User,
  Pet,
  Peeps,
  CustomPeeps,
  Post,
  TextPost
} = require('./models');

const _ids = {};
const _petIds = {};
const app = feathers()
  .use('/peeps', adapter({
    Model: Peeps,
    events: [ 'testing' ]
  }))
  .use('/peeps-customid', adapter({
    id: 'customid',
    Model: CustomPeeps,
    events: [ 'testing' ]
  }))
  .use('/people', adapter({
    Model: User,
    lean: false,
    multi: true,
    whitelist: [ '$populate' ]
  }))
  .use('/pets', adapter({
    Model: Pet,
    lean: false,
    multi: true,
    whitelist: [ '$populate' ]
  }))
  .use('/people2', adapter({
    Model: User,
    multi: true,
    whitelist: [ '$populate' ]
  }))
  .use('/pets2', adapter({
    Model: Pet,
    multi: true,
    whitelist: [ '$populate' ]
  }))
  .use('/posts', adapter({
    Model: Post,
    discriminators: [TextPost],
    multi: true,
    whitelist: [ '$populate' ]
  }));
const people = app.service('people');
const pets = app.service('pets');
const leanPeople = app.service('people2');
const leanPets = app.service('pets2');
const posts = app.service('posts');

// Tell mongoose to use native promises
// See http://mongoosejs.com/docs/promises.html
mongoose.Promise = global.Promise;

// Connect to your MongoDB instance(s)
mongoose.connect('mongodb://localhost:27017/feathers', {
  useNewUrlParser: true
});

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

  describe('Initialization', () => {
    it('throws an error when missing a Model', () => {
      expect(adapter.bind(null, { name: 'Test' })).to.throw(/You must provide a Mongoose Model/);
    });

    it('sets the default to be _id', () => {
      expect(people.id).to.equal('_id');
    });

    it('when missing the overwrite option sets the default to be true', () => {
      expect(people.overwrite).to.be.true;
    });

    it('when missing the lean option sets the default to be false', () => {
      expect(people.lean).to.be.false;
    });
  });

  describe('Special collation param', () => {
    function indexOfName (results, name) {
      let index;
      results.every(function (person, i) {
        if (person.name === name) {
          index = i;
          return false;
        }
        return true;
      });
      return index;
    }

    beforeEach(() => {
      return people.remove(null, {}).then(() => {
        return people.create([
          { name: 'AAA' },
          { name: 'aaa' },
          { name: 'ccc' }
        ]);
      });
    });

    it('sorts with default behavior without collation param', async () => {
      const r = await people.find({ query: { $sort: { name: -1 } } });

      expect(indexOfName(r, 'aaa')).to.be.below(indexOfName(r, 'AAA'));
    });

    // This appears to be a flaky test for some reason
    it.skip('sorts using collation param if present', async () => {
      const r = await people.find({
        query: { $sort: { name: -1 } },
        collation: { locale: 'en', strength: 1 }
      });

      expect(indexOfName(r, 'AAA')).to.be.below(indexOfName(r, 'aaa'));
    });

    it('removes with default behavior without collation param', async () => {
      await people.remove(null, { query: { name: { $gt: 'AAA' } } });

      const r = await people.find();

      expect(r).to.have.lengthOf(1);
      expect(r[0].name).to.equal('AAA');
    });

    it('removes using collation param if present', async () => {
      await people.remove(null, {
        query: { name: { $gt: 'AAA' } },
        collation: { locale: 'en', strength: 1 }
      });

      const r = await people.find();

      expect(r).to.have.lengthOf(3);
    });

    it('updates with default behavior without collation param', async () => {
      const query = { name: { $gt: 'AAA' } };
      const r = await people.patch(null, { age: 99 }, { query });

      expect(r).to.have.lengthOf(2);
      r.forEach(person => {
        expect(person.age).to.equal(99);
      });
    });

    it('updates using collation param if present', async () => {
      const r = await people.patch(null, { age: 110 }, {
        query: { name: { $gt: 'AAA' } },
        collation: { locale: 'en', strength: 1 }
      });

      expect(r).to.have.lengthOf(1);
      expect(r[0].name).to.equal('ccc');
    });
  });

  describe('Common functionality', () => {
    beforeEach(async () => {
      const pet = await pets.create({ type: 'dog', name: 'Rufus', gender: 'Unknown' });

      _petIds.Rufus = pet._id;

      const user = await people.create({
        name: 'Doug',
        age: 32,
        pets: [pet._id]
      });

      _ids.Doug = user._id;
    });

    afterEach(async () => {
      await pets.remove(null, { query: {} });
      await people.remove(null, { query: {} });
    });

    it('can $select with a String', async () => {
      const params = {
        query: {
          name: 'Rufus',
          $select: '+gender'
        }
      };

      const data = await pets.find(params);

      expect(data[0].gender).to.equal('Unknown');
    });

    it('can $select with an Array', async () => {
      const params = {
        query: {
          name: 'Rufus',
          $select: ['gender']
        }
      };

      const data = await pets.find(params);

      expect(data[0].gender).to.equal('Unknown');
    });

    it('can $select with an Object', async () => {
      const params = {
        query: {
          name: 'Rufus',
          $select: { 'gender': true }
        }
      };

      const data = await pets.find(params);

      expect(data[0].gender).to.equal('Unknown');
    });

    it('can $populate with find', async () => {
      const params = {
        query: {
          name: 'Doug',
          $populate: ['pets']
        }
      };

      const data = await people.find(params);

      expect(data[0].pets[0].name).to.equal('Rufus');
    });

    it('can $populate with get', async () => {
      const params = {
        query: {
          $populate: ['pets']
        }
      };

      const data = await people.get(_ids.Doug, params);

      expect(data.pets[0].name).to.equal('Rufus');
    });

    it('can patch a mongoose model', async () => {
      const dougModel = await people.get(_ids.Doug);
      const data = await people.patch(_ids.Doug, dougModel);

      expect(data.name).to.equal('Doug');
    });

    it('can patch a mongoose model', async () => {
      const dougModel = await people.get(_ids.Doug);
      const data = await people.update(_ids.Doug, dougModel);

      expect(data.name).to.equal('Doug');
    });

    it('can upsert with patch', async () => {
      const data = { name: 'Henry', age: 300 };
      const params = {
        mongoose: { upsert: true },
        query: { name: 'Henry' }
      };

      const result = await people.patch(null, data, params);

      expect(Array.isArray(result)).to.equal(true);

      const henry = result[0];

      expect(henry.name).to.equal('Henry');
    });

    it('can upsert with patch & receive writeResult', async () => {
      const data = { name: 'John', age: 200 };
      const params = {
        mongoose: { upsert: true, writeResult: true },
        query: { name: 'John' }
      };

      const results = await people.patch(null, data, params);

      expect(results).to.be.instanceOf(Object);
      expect(results).to.have.property('n', 1);
      expect(results).to.have.property('ok', 1);
      expect(results).to.have.property('nModified', 0);
      expect(results).to.have.property('upserted').instanceOf(Array).with.length(1);
    });

    it('can $populate with update', async () => {
      const params = {
        query: {
          $populate: ['pets']
        }
      };

      const doug = await people.get(_ids.Doug);
      const newDoug = doug.toObject();

      newDoug.name = 'Bob';

      const data = await people.update(_ids.Doug, newDoug, params);

      expect(data.name).to.equal('Bob');
      expect(data.pets[0].name).to.equal('Rufus');
    });

    it('can $populate with patch', async () => {
      const params = {
        query: {
          $populate: ['pets']
        }
      };

      const data = await people.patch(_ids.Doug, { name: 'Bob' }, params);

      expect(data.name).to.equal('Bob');
      expect(data.pets[0].name).to.equal('Rufus');
    });

    it('can $populate with .create (#268)', async () => {
      const params = {
        query: {
          $populate: ['pets']
        }
      };

      const user = await people.create({ name: 'Dougler', age: 3, pets: [ _petIds.Rufus ] }, params);

      expect(user.pets[0].name).to.equal('Rufus');

      await people.remove(user._id);
    });

    it('can $push an item onto an array with update', async () => {
      const margeaux = await pets.create({ type: 'cat', name: 'Margeaux' });

      await people.update(_ids.Doug, { $push: { pets: margeaux } });

      const params = {
        query: {
          $populate: ['pets']
        }
      };

      const data = await people.get(_ids.Doug, params);

      expect(data.pets[1].name).to.equal('Margeaux');
    });

    it('can $push an item onto an array with patch', async () => {
      const margeaux = await pets.create({ type: 'cat', name: 'Margeaux' });

      await people.patch(_ids.Doug, { $push: { pets: margeaux } });

      const params = {
        query: {
          $populate: ['pets']
        }
      };
      const data = await people.get(_ids.Doug, params);

      expect(data.pets[1].name).to.equal('Margeaux');
    });

    it('runs validators on update', async () => {
      const person = await people.create({ name: 'David', age: 33 });

      try {
        await people.update(person._id, { name: 'Dada', age: 'wrong' });
        throw new Error('Update should not be successful');
      } catch (error) {
        expect(error.name).to.equal('BadRequest');
        expect(error.message).to.equal('User validation failed: age: Cast to Number failed for value "wrong" at path "age"');
      }
    });

    it('runs validators on patch', async () => {
      const person = await people.create({ name: 'David', age: 33 });

      try {
        await people.patch(person._id, { name: 'Dada', age: 'wrong' });
        throw new Error('Update should not be successful');
      } catch (error) {
        expect(error.name).to.equal('BadRequest');
        expect(error.message).to.equal('Cast to number failed for value "wrong" at path "age"');
      }
    });

    it('returns a Conflict when unique index is violated', async () => {
      try {
        await pets.create({ type: 'cat', name: 'Bob' });
        await pets.create({ type: 'cat', name: 'Bob' });
        throw new Error('Should not be successful');
      } catch (error) {
        expect(error.name).to.equal('Conflict');
      }
    });

    it('Returns correct result when queried properties ar patched', async () => {
      const data = await pets.patch(null, { name: 'Spot' }, { query: { name: 'Rufus' } });
      expect(data).to.be.an('array');
      expect(data.length).to.equal(1);
      expect(data[0].name).to.equal('Spot');
    });
  });

  describe('Lean Services', () => {
    beforeEach(async () => {
      const pet = await leanPets.create({ type: 'dog', name: 'Rufus' });
      const user = await leanPeople.create({ name: 'Doug', age: 32, pets: [pet._id] });

      _petIds.Rufus = pet._id;
      _ids.Doug = user._id;
    });

    afterEach(async () => {
      await leanPets.remove(null, { query: {} });
      await leanPeople.remove(null, { query: {} });
    });

    it('can $populate with find', async () => {
      const params = {
        query: {
          name: 'Doug',
          $populate: ['pets']
        }
      };

      const data = await leanPeople.find(params);

      expect(data[0].pets[0].name).to.equal('Rufus');
    });

    it('can $populate with get', async () => {
      const params = {
        query: {
          $populate: ['pets']
        }
      };

      const data = await leanPeople.get(_ids.Doug, params);

      expect(data.pets[0].name).to.equal('Rufus');
    });

    it('can upsert with patch', async () => {
      const data = { name: 'Henry', age: 300 };
      const params = {
        mongoose: { upsert: true },
        query: { name: 'Henry' }
      };

      const results = await leanPeople.patch(null, data, params);

      expect(Array.isArray(results)).to.equal(true);

      const henry = results[0];

      expect(henry.name).to.equal('Henry');
    });
  });

  describe('Discriminators', () => {
    const data = {
      _type: 'text',
      text: 'Feathers!!!'
    };

    afterEach(async () => {
      await posts.remove(null, { query: {} });
    });

    it('can get a discriminated model', async () => {
      const result = await posts.create(data);
      const post = await posts.get(result._id);

      expect(post._type).to.equal('text');
      expect(post.text).to.equal('Feathers!!!');
    });

    it('can find discriminated models by the type', async () => {
      await posts.create(data);

      const result = await posts.find({ query: { _type: 'text' } });

      result.forEach(element => {
        expect(element._type).to.equal('text');
      });
    });

    it('can create a discriminated model', async () => {
      const result = await posts.create(data);

      expect(result._type).to.equal('text');
      expect(result.text).to.equal('Feathers!!!');
    });

    it('can update a discriminated model', async () => {
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

      const post = await posts.create(data);
      const result = await posts.update(post._id, update, params);

      expect(result._type).to.equal('text');
      expect(result.text).to.equal('Hello, world!');
    });

    it('can patch a discriminated model', async () => {
      const update = {
        text: 'Howdy folks!'
      };
      const params = {
        query: {
          _type: 'text'
        }
      };
      const post = await posts.create(data);
      const result = await posts.patch(post._id, update, params);

      expect(result.text).to.equal('Howdy folks!');
    });

    it('can remove a discriminated model', async () => {
      const post = await posts.create(data);
      const result = await posts.remove(post._id, { query: { _type: 'text' } });

      expect(result._type).to.equal('text');
    });
  });

  testSuite(app, errors, 'peeps', '_id');
  testSuite(app, errors, 'peeps-customid', 'customid');
});
