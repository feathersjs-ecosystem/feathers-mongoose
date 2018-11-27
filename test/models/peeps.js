const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PeepsSchema = new Schema({
  name: { type: String, required: true },
  age: { type: Number },
  created: { type: Boolean, 'default': false },
  time: { type: Number }
});

module.exports = mongoose.model('Peeps', PeepsSchema);
