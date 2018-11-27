var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TodoSchema = new Schema({
  text: { type: String, required: true },
  complete: { type: Boolean, 'default': false },
  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now }
});

var TodoModel = mongoose.model('Todo', TodoSchema);

module.exports = TodoModel;
