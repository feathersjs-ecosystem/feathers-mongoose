import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const PetSchema = new Schema({
  type: {type: String, required: true},
  name: {type: String, required: true, unique: true},
  gender: {type: String, required: false, select: false}
});

const PetModel = mongoose.model('Pet', PetSchema);

export default PetModel;
