/* eslint-disable no-unused-expressions */

require('feathers');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { hooks } = require('../lib');

const expect = chai.expect;
chai.use(sinonChai);

describe('Feathers Mongoose Hooks', () => {
  describe('toObject', () => {
    describe('options', () => {
      let toObject, hook;

      beforeEach(() => {
        toObject = sinon.spy();
        hook = {
          result: {toObject}
        };
      });

      it('sets default options', () => {
        hooks.toObject()(hook);
        expect(toObject).to.be.calledWith({});
      });

      it('supports custom options', () => {
        let options = {feathers: 'awesome'};
        hooks.toObject(options)(hook);
        expect(toObject).to.be.calledWith(options);
      });
    });

    describe('when results are mongoose model(s)', () => {
      let user1, user2, users;

      beforeEach(() => {
        user1 = {
          name: 'Jerry',
          age: 23,
          toObject: sinon.stub().returns({name: 'Jerry', age: 23})
        };

        user2 = {
          name: 'Mary',
          age: 32,
          toObject: sinon.stub().returns({name: 'Mary', age: 32})
        };

        users = [user1, user2];
      });

      it('converts paginated arrays of mongoose models', () => {
        let hook = {
          result: {data: users}
        };

        hooks.toObject()(hook);
        expect(users[0].toObject).to.be.calledOnce;
        expect(users[1].toObject).to.be.calledOnce;
        expect(hook.result.data[0]).to.deep.equal({name: 'Jerry', age: 23});
        expect(hook.result.data[1]).to.deep.equal({name: 'Mary', age: 32});
      });

      it('converts a single mongoose model', () => {
        let hook = {
          result: users[0]
        };

        hooks.toObject()(hook);
        expect(users[0].toObject).to.be.calledOnce;
        expect(hook.result).to.deep.equal({name: 'Jerry', age: 23});
      });

      it('converts non-paginated arrays of mongoose models', () => {
        let hook = {
          result: users
        };

        hooks.toObject()(hook);
        expect(users[0].toObject).to.be.calledOnce;
        expect(users[1].toObject).to.be.calledOnce;
        expect(hook.result[0]).to.deep.equal({name: 'Jerry', age: 23});
        expect(hook.result[1]).to.deep.equal({name: 'Mary', age: 32});
      });
    });

    describe('when results are plain object(s)', () => {
      let user1, user2, users;

      beforeEach(() => {
        user1 = {
          name: 'Jerry',
          age: 23
        };

        user2 = {
          name: 'Mary',
          age: 32
        };

        users = [user1, user2];
      });

      it('does not convert paginated arrays of objects', () => {
        let hook = {
          result: {data: users}
        };

        hooks.toObject()(hook);
        expect(hook.result.data[0]).to.deep.equal(user1);
        expect(hook.result.data[1]).to.deep.equal(user2);
      });

      it('does not convert non-paginated arrays of objects', () => {
        let hook = {
          result: users
        };

        hooks.toObject({}, null)(hook);
        expect(hook.result[0]).to.deep.equal(user1);
        expect(hook.result[1]).to.deep.equal(user2);
      });

      it('does not convert a single object', () => {
        let hook = {
          result: user1
        };

        hooks.toObject()(hook);
        expect(hook.result).to.deep.equal(user1);
      });
    });
  });
});
