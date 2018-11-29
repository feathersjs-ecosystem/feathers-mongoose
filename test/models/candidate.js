const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CandidateSchema = new Schema({
  name: { type: String, required: false, unique: true },
  token_id: { type: String, required: false, unique: false }
});

const CandidateModel = mongoose.model('Candidate', CandidateSchema);

module.exports = CandidateModel;
