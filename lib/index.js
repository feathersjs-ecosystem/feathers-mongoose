// Dependencies
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// -----------------
module.exports = function(modelName, schema, connection) {
    
    // Constructor
    function Store(modelName, schema, connection) {
        
        // Set model name
        this.name = modelName;

        // Create Schema
        this.schema = new Schema(schema);

        // Create Model
        this.model = connection.model(this.name, this.schema);

        return this;
    }

    // Returns a Todo by it's id
    Store.prototype.find = function (params, callback) {
        this.model.find(params.query, function (err, data) {
            callback(err, data);
        })
    }

    Store.prototype.get = function (id, params, callback) {
        this.model.find({ _id: id },function (err, data) {
            callback(err, data);
        });
    }

    Store.prototype.create = function (data, params, callback) {
      // Create our actual Todo object so that we only get what we really want
        var data = new this.model(data);
        data.save(function (err, data) {
            //console.log(err, data);
            callback(err, data);
        });
    }

    Store.prototype.update = function (id, data, params, callback) {
        this.model.update({_id: id}, data, { upsert: true }, function(err, data) {
            return callback(err, data);
        });
    }

    Store.prototype.remove = function (id, params, callback) {
        this.model.findByIdAndRemove(id, function(err, data) {
            return callback(err, data);
        });
    }

    return new Store(modelName, schema, connection);

}
