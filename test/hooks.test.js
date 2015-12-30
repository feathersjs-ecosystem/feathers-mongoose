import { expect } from 'chai';
// import errors from 'feathers-errors';
import * as hooks from '../src/hooks';

describe('Feathers Mongoose Hooks', () => {
  describe('toObject', () => {
    it('throws an error if hook is not a function', () => {
      let options = { foo: 'bar' };
      let fn = function(){};
      expect(hooks.toObject.bind(null, options, fn)).to.throw('Please use the hook as a function.');
    });
  });
});