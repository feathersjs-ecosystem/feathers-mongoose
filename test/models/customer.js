const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomerSchema = new Schema({
  name: { type: String, required: false, unique: false }
});

const CustomerModel = mongoose.model('Customer', CustomerSchema);

module.exports = CustomerModel;
