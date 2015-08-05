feathers-mongoose
================

[![NPM](https://nodei.co/npm/feathers-mongoose.png?downloads=true&stars=true)](https://nodei.co/npm/feathers-mongoose/)

[![Build Status](https://travis-ci.org/feathersjs/feathers-mongoose.svg?branch=master)](https://travis-ci.org/feathersjs/feathers-mongoose)
[![Code Climate](https://codeclimate.com/github/feathersjs/feathers-mongoose.png)](https://codeclimate.com/github/feathersjs/feathers-mongoose)


> Create a [Mongoose](http://mongoosejs.com/) ORM wrapped service for [FeathersJS](https://github.com/feathersjs).


## Installation

```bash
npm install feathers-mongoose --save
```

## Getting Started

Creating an Mongoose service is this simple:

```js
var mongooseService = require('feathers-mongoose');
app.use('todos', mongooseService('todo', todoSchema, options));
```

See the [Mongoose Schema Guide](http://mongoosejs.com/docs/guide.html) for more information on defining your schema.

### Complete Example

Here's a complete example of a Feathers server with a `todos` mongoose-service.

```js
// models/todo.js
var Todo = {
    schema: {
        title: {type: String, required: true},
        description: {type: String},
        dueDate: {type: Date, 'default': Date.now},
        complete: {type: Boolean, 'default': false, index: true}
    },
    methods: {
        isComplete: function(){
            return this.complete;
        }
    },
    statics: {
    },
    virtuals: {
    },
    indexes: [
        {'dueDate': -1, background: true}
    ]
};

// server.js
var feathers = require('feathers'),
  bodyParser = require('body-parser'),
  mongooseService = require('feathers-mongoose');

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
```

You can run this example by using `node examples/basic` and going to [localhost:8080/todos](http://localhost:8080/todos). You should see an empty array. That's because you don't have any Todos yet but you now have full CRUD for your new todos service, including mongoose validations!

## Options

The following options can be passed when creating a new Mongoose service:

**General options:**

- `connectionString` - A MongoDB connection string

**Connection options**: (when `connectionString` is not set)

- `username` - MongoDB username
- `password` - MongoDB password
- `db` - The name of the database (default: `"feathers"`) 
- `host` - The MongoDB host (default: `"localhost"`) 
- `port` - The MongoDB port (default: `27017`)
- `reconnect` - Whether the connection should automatically reconnect (default: `true`)

**Note:** By default, each service creates its own database connection. If you don't want this you can pass an existing mongoose connection via the `connection` property.

## Mongoose Schemas

The recommended way of defining and passing a model to a `feathers-mongoose` service is shown above. Using object literal syntax makes things easily testable without having to mock out existing mongoose functionality.

With that said, you have two other options:

### Passing a Mongoose Schema

```js
// models/todo.js
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TodoSchema = Schema({
    title: {type: String, required: true},
    description: {type: String},
    dueDate: {type: Date, 'default': Date.now},
    complete: {type: Boolean, 'default': false, index: true}
});

TodoSchema.methods.isComplete = function() {
    return this.complete;
}

TodoSchema.index({'dueDate': -1, background: true});

module.exports = TodoSchema;
```

Then you can simply pass that to a mongoose service like so:

```js
//server.js
app.use('todos', mongooseService('todo', TodoSchema));
```

### Passing a Mongoose Model
Usually before you are able to actually use a mongoose schema you need to turn it into a model. `feathers-mongoose` does that for you but you can also pass a mongoose model explicitly.

This style is not a whole lot different than above. Note the `mongoose.model()` call.

```js
// models/todo.js
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TodoSchema = Schema({
    title: {type: String, required: true},
    description: {type: String},
    dueDate: {type: Date, 'default': Date.now},
    complete: {type: Boolean, 'default': false, index: true}
});

TodoSchema.methods.isComplete = function() {
    return this.complete;
}

TodoSchema.index({'dueDate': -1, background: true});

module.exports = mongoose.model('Todo', TodoSchema);
```

Then you can simply pass that to a mongoose service like so:

```js
//server.js
app.use('todos', mongooseService('todo', TodoModel));
```


## Custom Validation

TODO (EK): Add example with custom validations using `node-validator` or something.

## Special Query Params
The `find` API allows the use of `$limit`, `$skip`, `$sort`, `$select`, `$populate` in the query.  These special parameters can be passed directly inside the query object:

```js
// Find all recipes that include salt, limit to 10, only include name field.
{"ingredients":"salt", "$limit":10, "$select":"name:1"} // JSON
GET /?ingredients=salt&%24limit=10&%24select=name%3A1 // HTTP
```

As a result of allowing these to be put directly into the query string, you won't want to use `$limit`, `$skip`, `$sort`, `$select`, or `$populate` as the name of fields in your document schema.

### `$limit`

`$limit` will return only the number of results you specify:

```
// Retrieves the first two records found where age is 37.
query: {
  age: 37,
  $limit: 2
}
```


### `$skip`

`$skip` will skip the specified number of results:

```
// Retrieves all except the first two records found where age is 37.
query: {
  age: 37,
  $skip: 2
}
```


### `$sort`

`$sort` will sort based on the object you provide:

```
// Retrieves all where age is 37, sorted ascending alphabetically by name.
query: {
  age: 37,
  $sort: {'name': 1}
}

// Retrieves all where age is 37, sorted descending alphabetically by name.
query: {
  age: 37,
  $sort: {'name': -1}
}
```


### `$select`
`$select` support in a query allows you to pick which fields to include or exclude in the results.  **Note:** you can use the include syntax or the exclude syntax, not both together.  See the section on [`Select`](http://mongoosejs.com/docs/api.html#query_Query-select) in the Mongoose docs.
```
// Only retrieve name.
query: {
  name: 'Alice',
  $select: {'name': 1}
}

// Retrieve everything except age.
query: {
  name: 'Alice',
  $select: {'age': 0}
}
```

### `$populate`
`$populate` support in a query allows you to populate an embedded document and return it in the results. See the section on [`Population`](http://mongoosejs.com/docs/populate.html) in the Mongoose docs.
```
// Return people named "Alice" and her children.
query: {
  name: 'Alice',
  $populate: ['children']
}
```


## API

`feathers-mongoose` services comply with the standard [FeathersJS API](http://feathersjs.com/docs).

## Changelog
### 2.0.0
- Consistency with other service adapters
- Compatibility with Feathers 1.0+
- Adequate tests
- Autoreconnect by default when not passing a connection string
- Add special query params:
    - $sort
    - $skip
    - $limit
    - $select
    - $populate

### 0.1.1
- First working release

### 0.1.0
- Initial release.

## License

[MIT](LICENSE)

## Authors

- [Eric Kryski](http://erickryski.com)
- [Glavin Wiechert](https://github.com/Glavin001)
