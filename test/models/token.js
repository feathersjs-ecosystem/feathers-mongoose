const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TokenSchema = new Schema({
  token: { type: String, required: true, unique: false }
});

const TokenModel = mongoose.model('Token', TokenSchema);

module.exports = TokenModel;
