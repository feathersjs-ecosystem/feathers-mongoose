import feathers from 'feathers';
import rest from 'feathers-rest';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import service from '../lib';
// Load the Model
import Model from './models/todo';

// Tell mongoose to use native promises
// See http://mongoosejs.com/docs/promises.html
mongoose.Promise = global.Promise;

// Connect to your MongoDB instance(s)
mongoose.connect('mongodb://localhost:27017/feathers');

// Create a feathers instance.
const app = feathers()
  // Enable REST services
  .configure(rest())
  // Turn on JSON parser for REST services
  .use(bodyParser.json())
  // Turn on URL-encoded parser for REST services
  .use(bodyParser.urlencoded({extended: true}));

// Connect to the db, create and register a Feathers service.
app.use('/todos', service({
  Model,
  paginate: {
    default: 2,
    max: 4
  }
}));

// Start the server if we're not being required in a test
if (!module.parent) {
  app.listen(3030);
  console.log('Feathers Todo mongoose service running on 127.0.0.1:3030');
}

export default app;
