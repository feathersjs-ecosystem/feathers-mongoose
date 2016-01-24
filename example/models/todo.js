import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const TodoSchema = new Schema({
  text: {type: String, required: true},
  complete: {type: Boolean, 'default': false, index: true},
  createdAt: {type: Date, 'default': Date.now},
  updatedAt: {type: Date, 'default': Date.now}
});

TodoSchema.index({'updatedAt': -1, background: true});

const TodoModel = mongoose.model('Todo', TodoSchema);

export default TodoModel;
