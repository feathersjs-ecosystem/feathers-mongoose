var mongoose = require('../../lib').mongoose;

var Todo = {
  schema: {
    text: {type: String, required: true},
    complete: {type: Boolean, 'default': false, index: true},
    createdAt: {type: Date, 'default': Date.now},
    updatedAt: {type: Date, 'default': Date.now}
  },
  methods: {
  },
  statics: {
  },
  virtuals: {
  },
  indexes: [
  {'updatedAt': -1, background: true}
  ]
};

module.exports = Todo;