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
var mongoose = require('mongoose');
var MongooseModel = require('./models/mymodel')
var mongooseService = require('feathers-mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/feathers');

app.use('/todos', mongooseService({
  Model: MongooseModel
}));
```

See the [Mongoose Guide](http://mongoosejs.com/docs/guide.html) for more information on defining your model.

### Complete Example

Here's a complete example of a Feathers server with a `todos` mongoose-service.

```js
// models/todo.js
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TodoSchema = new Schema({
  text: {type: String, required: true},
  complete: {type: Boolean, 'default': false},
  createdAt: {type: Date, 'default': Date.now},
  updatedAt: {type: Date, 'default': Date.now}
});

var TodoModel = mongoose.model('Todo', TodoSchema);

module.exports = TodoModel;


// server.js
var feathers = require('feathers');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var mongooseService = require('feathers-mongoose');

// Require your models
var Todo = require('./models/todo');

// Tell mongoose to use native promises
// See http://mongoosejs.com/docs/promises.html
mongoose.Promise = global.Promise;

// Connect to your MongoDB instance(s)
mongoose.connect('mongodb://localhost:27017/feathers');

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
app.use('/todos', mongooseService({ Model: Todo }));

// Start the server.
var port = 3030;
app.listen(port, function() {
    console.log('Feathers server listening on port ' + port);
});
```

You can run this example by using `node examples/app` and going to [localhost:3030/todos](http://localhost:3030/todos). You should see an empty array. That's because you don't have any Todos yet but you now have full CRUD for your new todos service, including mongoose validations!

## Options

The following options can be passed when creating a new Mongoose service:

- `Model` (**required**) - The Mongoose model definition
- `id` (default: `_id`) [optional] - The name of the id property
- `paginate` [optional] - A pagination object containing a `default` and `max` page size (see below)

## Pagination

When initializing the service you can set the following pagination options in the `paginate` object:

- `default` - Sets the default number of items
- `max` - Sets the maximum allowed number of items per page (even if the `$limit` query parameter is set higher)

When `paginate.default` is set, `find` will return an object (instead of the normal array) in the following form:

```
{
  "total": "<total number of records>",
  "limit": "<max number of items per page>",
  "skip": "<number of skipped items (offset)>",
  "data": [/* data */]
}
```


## Extending

There are several ways to extend the basic CRUD functionality of this service.

_Keep in mind that calling the original service methods will return a Promise that resolves with the value._

### feathers-hooks

The most flexible option is weaving in functionality through [feathers-hooks](https://github.com/feathersjs/feathers-hooks), for example, the
user that made the request could be added like this:

```js
var feathers = require('feathers');
var hooks = require('feathers-hooks');
var mongoose = require('mongoose');
var service = require('feathers-mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/feathers');

// Assuming todo.js exports the Mongoose model definition
var Todo = require('./models/todo.js');

var app = feathers()
  .configure(hooks())
  .use('/todos', service({
    Model: Todo,
    paginate: {
      default: 2,
      max: 4
    }
  }));

app.service('todos').before({
  // You can create a single hook like this
  create: function(hook, next) {
    hook.data.user_id = hook.params.user.id;
    next();
  }
});

app.listen(3030);
```

### Classes (ES6)

The module also exports a Babel transpiled ES6 class as `Service` that can be directly extended like this:

```js
import Todo from './models/todo';
import { Service } from 'feathers-mongoose';

class MyService extends Service {
  create(data, params) {
    data.user_id = params.user.id;

    return super.create(data, params);
  }
}

app.use('/todos', new MyService({
  Model: Todo,
  paginate: {
    default: 2,
    max: 4
  }
}));
```

### Uberproto (ES5)

You can also use `.extend` on a service instance (extension is provided by [Uberproto](https://github.com/daffl/uberproto)):

```js
var service = require('feathers-mongoose');
var myService = service({
  Model: Todo,
  paginate: {
    default: 2,
    max: 4
  }
}).extend({
  create: function(data, params) {
    data.user_id = params.user.id;

    return this._super.apply(this, arguments);
  }
});

app.use('/todos', myService);
```

**Note:** _this is more for backwards compatibility. We recommend the usage of hooks as they are easier to test, easier to maintain and are more flexible._


## Migrating

Version 3 of this adapter no longer brings its own Mongoose dependency, only accepts mongoose models and doesn't set up a database connection for you anymore. This means that you now need to make your own mongoose database connection and you need to pass in mongoose models changing something like

```js
var MySchema = require('./models/mymodel')
var mongooseService = require('feathers-mongoose');
app.use('todos', mongooseService('todo', MySchema, options));
```

To

```js
var mongoose = require('mongoose');
var MongooseModel = require('./models/mymodel')
var mongooseService = require('feathers-mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/feathers');

app.use('/todos', mongooseService({
  Model: MongooseModel
}));
```

## Validation

Mongoose by default gives you the ability to add [validations at the model level](http://mongoosejs.com/docs/validation.html). Using an error handler like the [middleware that comes with Feathers](https://github.com/feathersjs/generator-feathers/blob/master/app/templates/src/middleware/error-handler.js) your validation errors will be formatted nicely right out of the box!

For more complex validations you really have two options. You can combine Mongoose's validation mechanism with a validation library like [validator.js](https://github.com/chriso/validator.js) or you can do your validations at the service level using [feathers-hooks](https://github.com/feathersjs/feathers-hooks).

#### With Validator.js

Here's an example of doing more complex validations at the model level with the `validator.js` validation library.

```js
var validator = require('validator.js');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  email: {
    type: String,
    validate: {
      validator: validator.email,
      message: '{VALUE} is not a valid email!'
    }
  },
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return /d{3}-d{3}-d{4}/.test(v);
      },
      message: '{VALUE} is not a valid phone number!'
    }
  }
});

var User = mongoose.model('user', userSchema);

```

## Query Parameters

The `find` API allows the use of `$limit`, `$skip`, `$sort`, and `$select` in the query.  These special parameters can be passed directly inside the query object:

```js
// Find all recipes that include salt, limit to 10, only include name field.
{"ingredients":"salt", "$limit":10, "$select": ["name"] } } // JSON

GET /?ingredients=salt&$limit=10&$select[]=name // HTTP
```

As a result of allowing these to be put directly into the query string, you won't want to use `$limit`, `$skip`, `$sort`, or `$select` as the name of fields in your document schema.

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
  $sort: { name: 1 }
}

// Retrieves all where age is 37, sorted descending alphabetically by name.
query: {
  age: 37,
  $sort: { name: -1}
}
```

### `$select`

`$select` support in a query allows you to pick which fields to include or exclude in the results.

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


## Filter criteria

In addition to sorting and pagination, properties can also be filtered by criteria. Standard criteria can just be added to the query. For example, the following find all users with the name `Alice`:

```js
query: {
  name: 'Alice'
}
```

Additionally, the following advanced criteria are supported for each property.

### $in, $nin

Find all records where the property does (`$in`) or does not (`$nin`) contain the given values. For example, the following query finds every user with the name of `Alice` or `Bob`:

```js
query: {
  name: {
    $in: ['Alice', 'Bob']
  }
}
```

### $lt, $lte

Find all records where the value is less (`$lt`) or less and equal (`$lte`) to a given value. The following query retrieves all users 25 or younger:

```js
query: {
  age: {
    $lte: 25
  }
}
```

### $gt, $gte

Find all records where the value is more (`$gt`) or more and equal (`$gte`) to a given value. The following query retrieves all users older than 25:

```js
query: {
  age: {
    $gt: 25
  }
}
```

### $ne

Find all records that do not contain the given property value, for example anybody not age 25:

```js
query: {
  age: {
    $ne: 25
  }
}
```

### $or

Find all records that match any of the given objects. For example, find all users name Bob or Alice:

```js
query: {
  $or: [
    { name: 'Alice' },
    { name: 'Bob' }
  ]
}
```

### $populate
Allows you to populate an embedded document and return it in the results. See the section on [`Population`](http://mongoosejs.com/docs/populate.html) in the Mongoose docs.
```
// Return people named "Alice" and her children.
query: {
  name: 'Alice',
  $populate: ['children']
}
```

> **Note:** Typically you can only populate one level deeep.

## Changelog
### 3.0.0
- Compatibility with Feathers 2.x
- Changing how a service is initialized
- Removing mongoose as a bundled dependency
- Converting over to ES6
- Converting to use the new service test harness
- Moving over to Promises.
- Updating documentation and example.

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
