var feathers = require('feathers'),
  bodyParser = require('body-parser'),
  mongooseService = require('../lib/feathers-mongoose'),
  Todo = require('./models/todo');

// Create a feathers instance.
var app = feathers()
  // Setup the public folder.
  .use(feathers.static(__dirname + '/public'))
  // Enable Socket.io
  .configure(feathers.socketio())
  // Enable REST services
  .configure(feathers.rest())
  // Turn on JSON parser for REST services
  .use(bodyParser.json())
  // Turn on URL-encoded parser for REST services
  .use(bodyParser.urlencoded({extended: true}))

// Connect to the db, create and register a Feathers service.
app.use('todos', new mongooseService('todo', Todo));

// Start the server.
var port = 8080;
app.listen(port, function() {
    console.log('Feathers server listening on port ' + port);
});