feathers-mongoose-service
=========================

[![NPM version](https://badge.fury.io/js/feathers-mongoose-service.png)](http://badge.fury.io/js/feathers-mongoose-service)
[![Build Status](https://travis-ci.org/feathersjs/feathers-mongoose-service.png?branch=master)](https://travis-ci.org/Glavin001/feathers-mongoose-service)
[![authors](https://sourcegraph.com/api/repos/github.com/feathersjs/feathers-mongoose-service/badges/authors.png)](https://sourcegraph.com/github.com/Glavin001/feathers-mongoose-service)
[![Total views](https://sourcegraph.com/api/repos/github.com/Glavin001/feathers-mongoose-service/counters/views.png)](https://sourcegraph.com/github.com/Glavin001/feathers-mongoose-service)
[![Views in the last 24 hours](https://sourcegraph.com/api/repos/github.com/Glavin001/feathers-mongoose-service/counters/views-24h.png)](https://sourcegraph.com/github.com/Glavin001/feathers-mongoose-service)

[![NPM](https://nodei.co/npm/feathers-mongoose-service.png?downloads=true&stars=true)](https://nodei.co/npm/feathers-mongoose-service/)

> Easily create a [Mongoose](http://mongoosejs.com/) Service for [Featherjs](https://github.com/feathersjs).


## Installation

```bash
npm install feathers-mongoose-service --save
```


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
var customService = new mongooseService(modelName, mongooseSchema, mongooseConnection);
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
// Create your connection to Mongo
var connection = mongoose.connect('mongodb://localhost/test');
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
    }, connection);
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
// Create your connection to Mongo
var connection = mongoose.connect('mongodb://localhost/test');

// Create your Mongoose-Service, for a `User`
var userService = mongooseService('user', { 
        email: {type : String, required : true, index: {unique: true, dropDups: true}},
        firstName: {type : String, required : true},
        lastName: {type : String, required : true},
        age: {type : Number, required : true},
        password: {type : String, required : true, select: false},
        skills: {type : Array, required : true}
    }, connection);

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


## License

MIT

## Author

[Glavin Wiechert](https://github.com/Glavin001) 
