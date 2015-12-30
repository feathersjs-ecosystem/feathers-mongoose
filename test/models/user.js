import { hooks } from '../../src';

const User = {
  schema: {
    name: {type: String, required: true},
    age: {type: Number},
    created: {type: Boolean, 'default': false},
    time: {type: Number}
  },
  before:{
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },
  after:{
    all: [],
    find: [hooks.toObject()],
    get: [],
    create: [hooks.toObject()],
    update: [],
    patch: [],
    remove: []
  }
};

export default User;