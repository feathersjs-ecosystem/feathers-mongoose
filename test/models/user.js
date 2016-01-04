import mongoose from 'mongoose';
const Schema = mongoose.Schema;
// import { hooks } from '../../src';

const UserSchema = new Schema({
  name: {type: String, required: true},
  age: {type: Number},
  created: {type: Boolean, 'default': false},
  time: {type: Number}
});

const UserModel = mongoose.model('User', UserSchema);

export default UserModel;