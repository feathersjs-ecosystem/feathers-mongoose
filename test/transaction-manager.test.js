const { expect } = require('chai');
const feathers = require('@feathersjs/feathers');
const transactionManager = require('../lib/transaction-manager');
const adapter = require('../lib');
const { MongoClient } = require('mongodb');
const errors = require('@feathersjs/errors');

const {
  Candidate,
  Token
} = require('./models');
const app = feathers()
  .use('/candidates', adapter({ Model: Candidate }))
  .use('/tokens', adapter({ Model: Token }));

const candidate = app.service('candidates');
const token = app.service('tokens');

const saveCandidateToken = async context => {
  const newToken = context.data.token;
  const tokenResult = await token.create({ token: newToken }, context.params);
  context.data.token_id = tokenResult._id;
  return context;
};

const uri = 'mongodb://localhost:27017/feathers';
let client = {};
MongoClient.connect(uri, { useNewUrlParser: true }, (err, result) => {
  if (err) {
    throw new errors.GeneralError('Error while connecting to database');
  }
  client = result;
  app.set('mongoDbClient', client);
});

candidate.hooks({
  before: {
    create: [transactionManager.beginTransaction, saveCandidateToken],
    remove: [transactionManager.beginTransaction]
  },
  after: {
    create: [transactionManager.commitTransaction],
    remove: [transactionManager.commitTransaction]
  },
  error: {
    create: [transactionManager.rollbackTransaction],
    remove: [transactionManager.rollbackTransaction]
  }
});

token.hooks({
  before: {
    remove: [transactionManager.beginTransaction]
  },
  after: {
    remove: [transactionManager.rollbackTransaction]
  }
});

describe('transaction-manager', () => {
  const newCandidate = { name: 'abcd', token: '123' };
  it('Create transaction and commit session', async () => {
    await Candidate.deleteMany();
    await Token.deleteMany();
    return candidate.create(newCandidate).then(result => {
      expect(result.name).to.equal(newCandidate.name);
    });
  });
  it('Create transaction and rollback session', async () => {
    newCandidate.token = '456';
    return candidate.create(newCandidate).then().catch(error => {
      expect(error.name).to.equal('Conflict');
      return token.find({ query: { token: '456' } }).then(result => {
        expect(result).to.have.lengthOf(0);
      });
    });
  });
  it('Create transaction and commit session for remove', async () => {
    return candidate.remove(null, {}).then(() => {
      return candidate.find().then(result => {
        expect(result.length).to.equal(0);
      });
    });
  });
  it('Create transaction and rollback session for remove', async () => {
    return token.remove(null, {}).then(() => {
      return token.find().then(result => {
        expect(result.length).to.not.equal(0);
      });
    });
  });
});
