const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const options = {
  discriminatorKey: '_type'
};

const PostSchema = new Schema({
  createdAt: {type: Date, 'default': Date.now},
  updatedAt: {type: Date, 'default': Date.now}
}, options);

PostSchema.index({'updatedAt': -1, background: true});

module.exports = mongoose.model('Post', PostSchema);
