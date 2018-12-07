var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var options = {
  discriminatorKey: '_type'
};

var PostSchema = new Schema({
  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now }
}, options);

var PostModel = mongoose.model('Post', PostSchema);

module.exports = PostModel;
