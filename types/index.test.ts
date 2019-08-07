import { Schema, model } from 'mongoose';
import feathers from '@feathersjs/feathers';
import { default as mongoose, hooks, transactionManager } from 'feathers-mongoose';

const MessageSchema = new Schema({
  text: {
    type: String,
    required: true
  }
});
const Model = model('Message', MessageSchema);
const service = mongoose({
  Model,
  lean: true
});

service.Model;

const app = feathers().use('/test', service);

app.service('test').hooks({
  after: {
    all: [
      hooks.toObject(),
      transactionManager.beginTransaction,
      transactionManager.commitTransaction,
      transactionManager.rollbackTransaction
    ]
  }
});
