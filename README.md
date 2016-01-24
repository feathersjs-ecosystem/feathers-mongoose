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

## Documentation

Please refer to the [Feathers database adapter documentation](http://docs.feathersjs.com/databases/readme.html) for more details or directly at:

- [Mongoose](http://docs.feathersjs.com/databases/mongoose.html) - The detailed documentation for this adapter
- [Extending](http://docs.feathersjs.com/databases/extending.html) - How to extend a database adapter
- [Pagination and Sorting](http://docs.feathersjs.com/databases/pagination.html) - How to use pagination and sorting for the database adapter
- [Querying](http://docs.feathersjs.com/databases/querying.html) - The common adapter querying mechanism


### Complete Example

Here's a complete example of a Feathers server with a `todos` mongoose-service.

```js
import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const TodoSchema = new Schema({
  text: {type: String, required: true},
  complete: {type: Boolean, 'default': false},
  createdAt: {type: Date, 'default': Date.now},
  updatedAt: {type: Date, 'default': Date.now}
});
const Model = mongoose.model('Todo', TodoSchema);

export default Model;
```

Then in `server.js`:

```js
import feathers from 'feathers';
import rest from 'feathers-rest';
import bodyParser from 'bodyParser';
import mongoose from 'mongoose';
import service from 'feathers-mongoose';
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
  .use(bodyParser.urlencoded({extended: true}))

// Connect to the db, create and register a Feathers service.
app.use('/todos', service({ Model }));

// Start the server.
const port = 3030;
app.listen(port, function() {
    console.log(`Feathers server listening on port ${port}`);
});
```

You can run this example by using `node examples/app` and going to [localhost:3030/todos](http://localhost:3030/todos). You should see an empty array. That's because you don't have any Todos yet but you now have full CRUD for your new todos service, including mongoose validations!

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
