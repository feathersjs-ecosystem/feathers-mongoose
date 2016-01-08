import { expect } from 'chai';
import feathers from 'feathers';
import feathersHooks from 'feathers-hooks';
import { hooks, service } from '../src';
import Model from './models/user';

const _ids = {};
const app = feathers()
            .configure(feathersHooks())
            .use('/people', service({ name: 'Person', Model }));
const people = app.service('people');

describe('Feathers Mongoose Hooks', () => {
  describe('toObject', () => {
    before(done => {
      people.create({ name: 'Doug', age: 32 }).then(user => {
        _ids.Doug = user._id;
        done();
      });
    });

    after(done => {
      people.remove(null, {}).then(() => {
        done();
      });
    });

    it('throws an error if hook is not a function', () => {
      let options = { foo: 'bar' };
      let fn = function(){};
      expect(hooks.toObject.bind(null, options, fn)).to.throw('Please use the toObject hook as a function.');
    });

    it.skip('The toObject hook converts arrays of mongoose model instances to plain objects.', done => {
      people.find({}).then(data => {
        expect(data).to.be.instanceof(Array);
        expect(data[0].toObject).to.be.undefined;
        return done();
      });
    });

    it.skip('The toObject hook converts a mongoose model instance to a plain object.', done => {
      let user = {
        name: 'Jerry',
        age: 23
      };

      people.create(user).then(data => {
        expect(data.toObject).to.be.undefined;
        return done();
      });
    });
  });
});