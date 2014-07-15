var feathers = require('feathers');
var mongooseService = require('../lib/mongoose');
var bodyParser = require('body-parser');

// Create your Mongoose-Service, for a `User`
var userService = mongooseService('user', {
    email: {type : String, required : true, index: {unique: true, dropDups: true}},
    firstName: {type : String, required : true},
    lastName: {type : String, required : true}
  });

// Setup Feathers
var app = feathers();

app.configure(feathers.rest())
   .use(bodyParser.json())
   .use('/users', userService)
   .configure(feathers.errors())
   .listen(8080);

console.log('App listening on 127.0.0.1:8080');
