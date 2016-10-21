var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TodoSchema = new Schema({
  text: {type: String, required: true},
  complete: {type: Boolean, 'default': false, index: true},
  createdAt: {type: Date, 'default': Date.now},
  updatedAt: {type: Date, 'default': Date.now}
});

TodoSchema.index({'updatedAt': -1, background: true});

var TodoModel = mongoose.model('Todo', TodoSchema);

module.exports = TodoModel;
