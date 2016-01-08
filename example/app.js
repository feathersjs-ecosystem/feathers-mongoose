var feathers = require('feathers');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var mongooseService = require('../lib');

// Require your models
var Todo = require('./models/todo');

// Tell mongoose to use native promises
// See http://mongoosejs.com/docs/promises.html
mongoose.Promise = global.Promise;

// Connect to your MongoDB instance(s)
mongoose.connect('mongodb://localhost:27017/feathers');


// Create a feathers instance.
var app = feathers()
  // Enable Socket.io
  .configure(feathers.socketio())
  // Enable REST services
  .configure(feathers.rest())
  // Turn on JSON parser for REST services
  .use(bodyParser.json())
  // Turn on URL-encoded parser for REST services
  .use(bodyParser.urlencoded({extended: true}))

// Connect to the db, create and register a Feathers service.
app.use('todos', mongooseService({
  name: 'todo',
  Model: Todo,
  paginate: {
    default: 2,
    max: 4
  }
}));

// A basic error handler, just like Express
app.use(function(error, req, res, next){
  res.json(error);
});

// Start the server if we're not being required in a test
if (!module.parent) {
  app.listen(3030);
  console.log('Feathers Todo mongoose service running on 127.0.0.1:3030');
}

module.exports = app;