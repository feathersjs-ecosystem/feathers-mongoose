import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const PeepsSchema = new Schema({
  name: { type: String, required: true },
  age: { type: Number },
  created: {type: Boolean, 'default': false},
  time: {type: Number}
});

export default mongoose.model('Peeps', PeepsSchema);
