import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const PetSchema = new Schema({
  type: {type: String, required: true},
  name: {type: String, required: true, unique: true}
});

const PetModel = mongoose.model('Pet', PetSchema);

export default PetModel;