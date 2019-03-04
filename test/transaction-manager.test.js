const { expect } = require('chai');
const feathers = require('@feathersjs/feathers');
const transactionManager = require('../lib/transaction-manager');
const adapter = require('../lib');
const mongoose = require('mongoose');

const {
  Candidate,
  Token,
  Customer
} = require('./models');
const app = feathers()
  .use('/candidates', adapter({ Model: Candidate }))
  .use('/tokens', adapter({ Model: Token }))
  .use('/customers', adapter({ Model: Customer }));

const candidate = app.service('candidates');
const token = app.service('tokens');
const customerService = app.service('customers');

const saveCandidateToken = async context => {
  const newToken = context.data.token;
  const tokenResult = await token.create({ token: newToken }, context.params);
  context.data.token_id = tokenResult._id;
  return context;
};

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
});

// Start a transaction in a mongoose session.
const getTransaction = async () => {
  try {
    const client = mongoose.connections[0];
    const session = await client.startSession();
    await session.startTransaction();
    const params = {};
    params.mongoose = { session };
    return params;
  } catch (error) {
    throw error;
  }
};

describe('transaction-manager for find and get', () => {
  const data = { name: 'Customer' };
  it('Create with transaction and find without transaction', async () => {
    const params = await getTransaction();
    await customerService.create(data, params);
    const customers = await customerService.find();
    await params.mongoose.session.commitTransaction();
    await Customer.deleteMany();
    expect(0).to.equal(customers.length);
  });

  it('Create and find with transaction', async () => {
    const params = await getTransaction();
    await customerService.create(data, params);
    const customers = await customerService.find(params);
    await params.mongoose.session.commitTransaction();
    await Customer.deleteMany();
    expect(1).to.equal(customers.length);
  });

  it('Create with transaction and get without transaction', async () => {
    const params = await getTransaction();
    try {
      const newCustomer = await customerService.create(data, params);
      await customerService.get(newCustomer._id);
    } catch (error) {
      expect('not-found').to.equal(error.className);
    } finally {
      await params.mongoose.session.abortTransaction();
    }
  });

  it('Create and get with transaction', async () => {
    const params = await getTransaction();
    const newCustomer = await customerService.create(data, params);
    const customer = await customerService.get(newCustomer._id, params);
    await params.mongoose.session.commitTransaction();
    await Customer.deleteMany();
    expect(newCustomer.name).to.equal(customer.name);
  });
});
