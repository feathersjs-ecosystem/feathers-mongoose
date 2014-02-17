// Get Feathers
var feathers = require('feathers');
// Get Mongoose
var mongoose = require('mongoose');
// Connect to your MongoDB
mongoose.connect('mongodb://localhost/test');

// Get Mongoose-Service
var mongooseService = require('../lib'); // Mongoose-Service

// Create your Mongoose-Service, for a `User`
var userService = mongooseService('user', {
        email: {type : String, required : true, index: {unique: true, dropDups: true}},
        firstName: {type : String, required : true},
        lastName: {type : String, required : true},
        age: {type : Number, required : true},
        password: {type : String, required : true, select: false},
        skills: {type : Array, required : true}
    }, mongoose);

// Setup Feathers
var app = feathers();

// Configure Feathers
app.use(feathers.logger('dev')); // For debugging purposes.
// ................
var port = 8080;
// ................
app.configure(feathers.socketio())
  .use('/user', userService) // <-- Register your custom Mongoose-Service with Feathers
  .listen(port, function() {
        console.log('Express server listening on port ' + port);
    });
