const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Post = require('./post');

const options = {
  discriminatorKey: '_type'
};

const TextPostSchema = new Schema({
  text: { type: String, default: null }
}, options);

const TextPostModel = Post.discriminator('text', TextPostSchema);

module.exports = TextPostModel;
