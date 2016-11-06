import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const negativeAgeValidator = function () {
  // With option "context: 'query'", mongoose pass a Query object to validators when update or findAndModify a mongoose object
  // Plus findAndModify mongoose method put document in a $set object when update mongoose method don't
  // So you're forced to test these cases to retrieve your properties
  var age = (this.constructor.name === 'Query' ? (this.getUpdate().$set ? this.getUpdate().$set.age : this.getUpdate().age) : this.age);
  return (age > 0);
};

const UserSchema = new Schema({
  name: { type: String, required: true },
  age: {
    type: Number,
    validate: [negativeAgeValidator, 'Age couldn\'t be negative']
  },
  created: {type: Boolean, 'default': false},
  time: {type: Number},
  pets: [{type: Schema.ObjectId, ref: 'Pet'}]
});

const UserModel = mongoose.model('User', UserSchema);

export default UserModel;
