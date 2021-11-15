const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TodoSchema = new Schema({
  text: { type: String, required: true },
  complete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const TodoModel = mongoose.model('Todo', TodoSchema);

module.exports = TodoModel;
