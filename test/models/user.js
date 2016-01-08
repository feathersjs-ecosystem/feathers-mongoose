import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {type: String, required: true},
  age: {type: Number},
  created: {type: Boolean, 'default': false},
  time: {type: Number},
  pets: [{type: Schema.ObjectId, ref: 'Pet'}]
});

const UserModel = mongoose.model('User', UserSchema);

export default UserModel;