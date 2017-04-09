var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Post = require('./post');

var options = {
  discriminatorKey: '_type'
};

var TextPostSchema = new Schema({
  text: { type: String, default: null }
}, options);

TextPostSchema.index({'updatedAt': -1, background: true});

var TextPostModel = Post.discriminator('text', TextPostSchema);

module.exports = TextPostModel;
