import { expect } from 'chai';
import errors from 'feathers-errors';
import * as utils from '../src/utils';

describe('Feathers Mongoose Utils', () => {
  describe('errorHandler', () => {
    it('throws a feathers error', () => {
      let e = new errors.GeneralError();
      expect(utils.errorHandler.bind(null, e)).to.throw(errors.GeneralError);
    });
  });
});