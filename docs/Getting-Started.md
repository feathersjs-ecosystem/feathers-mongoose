# Getting Started

## Usage

> **Important**: Read over the [Feathers documentation](http://feathersjs.com/#documentation), specifically the section on [Services](http://feathersjs.com/#toc12). All of the Feathers REST and Socket API requests are supported.

### Run example:

Run the following:

```
node example/index.js
```

Open your browser to [http://localhost:8080/user](http://localhost:8080/user). 
There will likely be an empty array in response. This is because you have no `User`s, yet.

I recommend the [Postman extension for Chrome](https://chrome.google.com/webstore/detail/postman-rest-client/fdmmgilgnpjigdojojpjoooidkmcomcm) if you would like an easy to use REST Client.

### How To Create a Mongoose Service

```javascript
var customService = new mongooseService(modelName, schema, mongoose);
```

See [Mongoose Schema Guide](http://mongoosejs.com/docs/guide.html) for more information on defining your schema.

> Skip to [Step 3](#3-create-your-custom-mongoose-service) for the important part.

#### 1) Get your dependencies.

```javascript
// Get Feathers
var feathers = require('feathers');
// Get Mongoose
var mongoose = require('mongoose');
// Get Mongoose-Service
var mongooseService = require('feathers-mongoose-service'); 
```

#### 2) Create your Mongoose connection to Mongodb.

```javascript
// Get Mongoose
var mongoose = require('mongoose');
// Connect to your MongoDB
mongoose.connect('mongodb://localhost/test');
```

#### 3) **Create your custom Mongoose Service**

```javascript
// Create your Mongoose-Service, for a `User`
var userService = mongooseService('user', { 
        email: {type : String, required : true, index: {unique: true, dropDups: true}},
        firstName: {type : String, required : true},
        lastName: {type : String, required : true},
        age: {type : Number, required : true},
        password: {type : String, required : true, select: false},
        skills: {type : Array, required : true}
    }, mongoose);
```

#### 4) Use your service with Feathers.

```javascript
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
```

### Complete Working Example code:

```javascript
// Get Feathers
var feathers = require('feathers');
// Get Mongoose
var mongoose = require('mongoose');
// Get Mongoose-Service
var mongooseService = require('feathers-mongoose-service');
// Connect to your MongoDB
mongoose.connect('mongodb://localhost/test');

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
```
