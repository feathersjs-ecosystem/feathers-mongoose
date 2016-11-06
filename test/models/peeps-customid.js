import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const PeepsSchema = new Schema({
  customid: {
    type: Schema.Types.ObjectId,
    default: function () {
      return new mongoose.Types.ObjectId();
    }
  },
  name: { type: String, required: true },
  age: { type: Number },
  created: {type: Boolean, 'default': false},
  time: {type: Number}
});

export default mongoose.model('PeepsCustomid', PeepsSchema);
