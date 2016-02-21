var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessageSchema = new Schema({
  text: {type: String, required: true},
  createdAt: {type: Date, 'default': Date.now},
  updatedAt: {type: Date, 'default': Date.now}
});

MessageSchema.index({'updatedAt': -1, background: true});

var MessageModel = mongoose.model('Message', MessageSchema);

module.exports = MessageModel;