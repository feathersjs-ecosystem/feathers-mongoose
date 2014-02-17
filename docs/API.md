# API

All requests below are assumed that *your* service's `path` is `"/path"`.

For instance, if you added your service with the following `path`:

```javascript
app.use('/path', yourService) // <-- Register your custom Mongoose-Service with Feathers
```

Then the corresponding `GET` request to `find all` of the [documents](http://docs.mongodb.org/manual/core/document/) would be:

```
GET /path
```

**Important**: Make sure all requests have the `Content-Type` set to `application/json`. See [Feathersjs Issue](https://github.com/feathersjs/feathers/issues/40) for more information.

-----

## Finding [Documents](http://docs.mongodb.org/manual/core/document/)

This query will return all documents at that `path`.

```
GET /path
```

### Advanced Querying

You have access to the powerful query language behind Mongoose and MongoDB.

See [Mongoose's find method](http://mongoosejs.com/docs/api.html#model_Model.find) for details of how it works behind the scenes.

Example request with all of the optional query parameters:

```
GET /path?conditions={}&fields="field1 field 2"&options={"sort":{"field":-1}}
```

#### Conditions

See [Mongoose find](http://mongoosejs.com/docs/api.html#model_Model.find) for details.

#### Fields

See [Mongoose field selection](http://mongoosejs.com/docs/api.html#query_Query-select) for details.

#### Options

See [Mongoose options](http://mongoosejs.com/docs/api.html#query_Query-setOptions) for details.

## Finding a Specific [Document](http://docs.mongodb.org/manual/core/document/) by Id

```
GET /path/:id
```

### Advanced Querying

See [Advanced Querying, above](#Advanced-Querying).


## Updating a Specific [Document](http://docs.mongodb.org/manual/core/document/) by Id

```
PUT /path/:id
```

## Deleting a Specific [Document](http://docs.mongodb.org/manual/core/document/) by Id

```
DELETE /path/:id
```
