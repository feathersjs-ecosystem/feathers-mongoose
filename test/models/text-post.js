const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Post = require('./post');

const options = {
  discriminatorKey: '_type'
};

const TextPostSchema = new Schema({
  text: { type: String, default: null }
}, options);

TextPostSchema.index({'updatedAt': -1, background: true});

module.exports = Post.discriminator('text', TextPostSchema);
