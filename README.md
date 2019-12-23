# feathers-mongoose

[![Greenkeeper badge](https://badges.greenkeeper.io/feathersjs-ecosystem/feathers-mongoose.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/feathersjs-ecosystem/feathers-mongoose.png?branch=master)](https://travis-ci.org/feathersjs-ecosystem/feathers-mongoose)
[![Dependency Status](https://img.shields.io/david/feathersjs-ecosystem/feathers-mongoose.svg?style=flat-square)](https://david-dm.org/feathersjs-ecosystem/feathers-mongoose)
[![Download Status](https://img.shields.io/npm/dm/feathers-mongoose.svg?style=flat-square)](https://www.npmjs.com/package/feathers-mongoose)

A [Feathers](https://feathersjs.com) database adapter for [Mongoose](http://mongoosejs.com/), an object modeling tool for [MongoDB](https://www.mongodb.org/).

```bash
$ npm install --save mongoose feathers-mongoose
```

> __Important:__ `feathers-mongoose` implements the [Feathers Common database adapter API](https://docs.feathersjs.com/api/databases/common.html) and [querying syntax](https://docs.feathersjs.com/api/databases/querying.html).

> This adapter also requires a [running MongoDB](https://docs.mongodb.com/getting-started/shell/#) database server.


## API

### `service(options)`

Returns a new service instance initialized with the given options. `Model` has to be a Mongoose model. See the [Mongoose Guide](http://mongoosejs.com/docs/guide.html) for more information on defining your model.

```js
const mongoose = require('mongoose');
const service = require('feathers-mongoose');

// A module that exports your Mongoose model
const Model = require('./models/message');

// Make Mongoose use the ES6 promise
mongoose.Promise = global.Promise;

// Connect to a local database called `feathers`
mongoose.connect('mongodb://localhost:27017/feathers');

app.use('/messages', service({ Model }));
app.use('/messages', service({ Model, lean, id, events, paginate }));
```

__Options:__

- `Model` (**required**) - The Mongoose model definition
- `lean` (*optional*, default: `true`) - Runs queries faster by returning plain objects instead of Mongoose models.
- `id` (*optional*, default: `'_id'`) - The name of the id field property.
- `events` (*optional*) - A list of [custom service events](https://docs.feathersjs.com/api/events.html#custom-events) sent by this service
- `paginate` (*optional*) - A [pagination object](https://docs.feathersjs.com/api/databases/common.html#pagination) containing a `default` and `max` page size
- `whitelist` (*optional*) - A list of additional query parameters to allow (e..g `[ '$regex', '$populate' ]`)
- `multi` (*optional*) - Allow `create` with arrays and `update` and `remove` with `id` `null` to change multiple items. Can be `true` for all methods or an array of allowed methods (e.g. `[ 'remove', 'create' ]`)
- `overwrite` (*optional*, default: `true`) - Overwrite the document when update, making mongoose detect is new document and trigger default value for unspecified properties in mongoose schema.
- `discriminators` (*optional*) - A list of mongoose models that inherit from `Model`.
- `useEstimatedDocumentCount` (*optional*, default: `false`) - Use `estimatedDocumentCount` instead (usuall not necessary)

> **Important:** To avoid odd error handling behaviour, always set `mongoose.Promise = global.Promise`. If not available already, Feathers comes with a polyfill for native Promises.

<!-- -->

> **Important:** When setting `lean` to `false`, Mongoose models will be returned which can not be modified unless they are converted to a regular JavaScript object via `toObject`.

<!-- -->

> **Note:** You can get access to the Mongoose model via `this.Model` inside a [hook](https://docs.feathersjs.com/api/hooks.html) and use it as usual. See the [Mongoose Guide](http://mongoosejs.com/docs/guide.html) for more information on defining your model.

### params.mongoose

When making a [service method](https://docs.feathersjs.com/api/services.html) call, `params` can contain a `mongoose` property which allows you to modify the options used to run the Mongoose query. Normally, this will be set in a before [hook](https://docs.feathersjs.com/api/hooks.html):

```js
app.service('messages').hooks({
  before: {
    patch(context) {
      // Set some additional Mongoose options
      // The adapter tries to use these settings by defaults
      // but they can always be changed here
      context.params.mongoose = {
        runValidators: true,
        setDefaultsOnInsert: true
      }
    }
  }
});
```

The `mongoose` property is also useful for performing upserts on a `patch` request.  "Upserts" do an update if a matching record is found, or insert a record if there's no existing match.  The following example will create a document that matches the `data`, or if there's already a record that matches the `params.query`, that record will be updated.

Using the `writeResult` mongoose option will return the write result of a `patch` operation, including the _ids of all upserted or modified documents. This can be helpful alongside the `upsert` flag, for detecting whether the outcome was a find or insert operation. More on write results is available in the [Mongo documentation](https://docs.mongodb.com/manual/reference/method/db.collection.update/#writeresult)

```js
const data = { address: '123', identifier: 'my-identifier' }
const params = {
  query: { address: '123' },
  mongoose: { upsert: true, writeResult: true }
}
app.service('address-meta').patch(null, data, params)
```


## Example

Here's a complete example of a Feathers server with a `messages` Mongoose service.

```
$ npm install @feathersjs/feathers @feathersjs/errors @feathersjs/express @feathersjs/socketio mongoose feathers-mongoose
```

In `message-model.js`:

```js
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const MessageSchema = new Schema({
  text: {
    type: String,
    required: true
  }
});
const Model = mongoose.model('Message', MessageSchema);

module.exports = Model;
```

Then in `app.js`:

```js
const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const socketio = require('@feathersjs/socketio');

const mongoose = require('mongoose');
const service = require('feathers-mongoose');

const Model = require('./message-model');

mongoose.Promise = global.Promise;

// Connect to your MongoDB instance(s)
mongoose.connect('mongodb://localhost:27017/feathers');

// Create an Express compatible Feathers application instance.
const app = express(feathers());

// Turn on JSON parser for REST services
app.use(express.json());
// Turn on URL-encoded parser for REST services
app.use(express.urlencoded({extended: true}));
// Enable REST services
app.configure(express.rest());
// Enable Socket.io services
app.configure(socketio());
// Connect to the db, create and register a Feathers service.
app.use('/messages', service({
  Model,
  lean: true, // set to false if you want Mongoose documents returned
  paginate: {
    default: 2,
    max: 4
  }
}));
app.use(express.errorHandler());

// Create a dummy Message
app.service('messages').create({
  text: 'Message created on server'
}).then(function(message) {
  console.log('Created message', message);
});

// Start the server.
const port = 3030;
app.listen(port, () => {
    console.log(`Feathers server listening on port ${port}`);
});
```

You can run this example by using `node app` and go to [localhost:3030/messages](http://localhost:3030/messages).

## Querying, Validation

Mongoose by default gives you the ability to add [validations at the model level](http://mongoosejs.com/docs/validation.html). Using an error handler like the one that [comes with Feathers](https://github.com/feathersjs/feathers-errors/blob/master/src/error-handler.js) your validation errors will be formatted nicely right out of the box!

For more information on querying and validation refer to the [Mongoose documentation](http://mongoosejs.com/docs/guide.html).

## $populate

For Mongoose, the special `$populate` query parameter can be used to allow [Mongoose query population](http://mongoosejs.com/docs/populate.html).

> **Important:** `$populate` has to be whitelisted explicitly since it can expose protected fields in sub-documents (like the user password) which have to be removed manually.

```js
const mongoose = require('feathers-mongoose');

app.use('/posts', mongoose({
  Model,
  whitelist: [ '$populate' ]
});

app.service('posts').find({
  query: { $populate: 'user' }
});
```

## Error handling

As of v7.3.0, the original Mongoose error can be retrieved on the server via:

```js
const { ERROR } = require('feathers-mongoose');

try {
  await app.service('posts').create({ value: 'invalid' });
} catch(error) {
  // error is a FeathersError
  // Safely retrieve the original Mongoose error
  const mongooseError = error[ERROR];
}
```


## Discriminators (Inheritance)

Instead of strict inheritance, Mongoose uses [discriminators](http://mongoosejs.com/docs/discriminators.html) as their schema inheritance model.
To use them, pass in a `discriminatorKey` option to your schema object and use `Model.discriminator('modelName', schema)` instead of `mongoose.model()`

Feathers comes with full support for mongoose discriminators, allowing for automatic fetching of inherited types. A typical use case might look like:

```js
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Post = require('./post');
var feathers = require('@feathersjs/feathers');
var app = feathers();
var service = require('feathers-mongoose');

// Discriminator key, we'll use this later to refer to all text posts
var options = {
  discriminatorKey: '_type'
};

var TextPostSchema = new Schema({
  text: { type: String, default: null }
}, options);

// Note the use of `Post.discriminator` rather than `mongoose.discriminator`.
var TextPost = Post.discriminator('text', TextPostSchema);

// Using the discriminators option, let feathers know about any inherited models you may have
// for that service
app.use('/posts', service({
  Model: Post,
  discriminators: [TextPost]
}))

```

Without support for discriminators, when you perform a `.get` on the posts service, you'd only get back `Post` models, not `TextPost` models.
Now in your query, you can specify a value for your discriminatorKey:

```js
{
  _type: 'text'
}
```

and Feathers will automatically swap in the correct model and execute the query it instead of its parent model.

## Collation Support

This adapter includes support for [collation and case insensitive indexes available in MongoDB v3.4](https://docs.mongodb.com/manual/release-notes/3.4/#collation-and-case-insensitive-indexes). Collation parameters may be passed using the special `collation` parameter to the `find()`, `remove()` and `patch()` methods.

### Example: Patch records with case-insensitive alphabetical ordering

The example below would patch all student records with grades of `'c'` or `'C'` and above (a natural language ordering). Without collations this would not be as simple, since the comparison `{ $gt: 'c' }` would not include uppercase grades of `'C'` because the code point of `'C'` is less than that of `'c'`.

```js
const patch = { shouldStudyMore: true };
const query = { grade: { $gte: 'c' } };
const collation = { locale: 'en', strength: 1 };
students.patch(null, patch, { query, collation }).then( ... );
```

### Example: Find records with a case-insensitive search

Similar to the above example, this would find students with a grade of `'c'` or greater, in a case-insensitive manner.

```js
const query = { grade: { $gte: 'c' } };
const collation = { locale: 'en', strength: 1 };
students.find({ query, collation }).then( ... );
```

For more information on MongoDB's collation feature, visit the [collation reference page](https://docs.mongodb.com/manual/reference/collation/).


## Mongo-DB Transaction

This adapter includes support to enable database transaction to rollback the persisted records for any error occured for a api call. This requires  [Mongo-DB v4.x](https://docs.mongodb.com/manual/) installed and [replica-set](https://linode.com/docs/databases/mongodb/create-a-mongodb-replica-set/#start-replication-and-add-members) enabled.

Start working with transaction enabled by adding the following lines in `app.hooks.js` or `<any-service>.hooks.js`.

```js
const TransactionManager = require('feathers-mongoose').TransactionManager;
const isTransactionEnable = process.env.TRANSACTION_ENABLE || false;
const skipPath = ['login'];

let moduleExports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [
      when(isTransactionEnable, async hook =>
        TransactionManager.beginTransaction(hook, skipPath)
      )
    ],
    update: [
      when(isTransactionEnable, async hook =>
        TransactionManager.beginTransaction(hook, skipPath)
      )
    ],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [when(isTransactionEnable, TransactionManager.commitTransaction)],
    update: [when(isTransactionEnable, TransactionManager.commitTransaction)],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [when(isTransactionEnable, TransactionManager.rollbackTransaction)],
    update: [when(isTransactionEnable, TransactionManager.rollbackTransaction)],
    patch: [],
    remove: []
  }
};

module.exports = moduleExports;
```

## Contributing

This module is community maintained and open for pull requests. Features and bug fixes should contain

- The bug fix / feature code
- Tests to reproduce the bug or test the feature
- Documentation updates (if necessary)

To contribute, fork and clone the repository. To run the tests, a MongoDB v4.0.0 server is required. If you do not have a MongoDB server running you can start one with:

```
npm run mongodb
```

The command needs to stay open while running the tests with


```
npm test
```

## License

[MIT](LICENSE)

## Authors

- [Feathers contributors](https://github.com/feathersjs-ecosystem/feathers-mongoose/graphs/contributors)
