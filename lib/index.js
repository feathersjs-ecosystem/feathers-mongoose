// Dependencies

// -----------------
module.exports = function(modelName, schema, mongoose) {
    
    // Constructor
    function Store(modelName, schema, mongoose) {
        // Extract 
        var Schema = mongoose.Schema;
        var connection = mongoose.connection;

        // Set model name
        this.name = modelName;

        // Create Schema
        this.schema = new Schema(schema);

        // Create Model
        this.model = connection.model(this.name, this.schema);

        return this;
    }

    // Getter methods for 'model' and 'schema'
    Store.prototype.getModel = function() {
        return this.model;
    };

    Store.prototype.getSchema = function () {
        return this.schema;
    };

    // Helpers
    var parseQuery = function(query) {
        if (typeof query !== 'object')
        {
            query = {};
        }
        // Parse query arguments
        for (var k in query)
        {
            if (typeof query[k] !== 'object')
            {
                try
                {
                    query[k] = JSON.parse(query[k]);
                } catch (e)
                {
                    console.log('Error:', e);
                    query[k] = null;
                }
            }
        }
        return query;
    };

    // Returns a Todo by it's id
    Store.prototype.find = function (params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = {};
        }
        var query = parseQuery(params.query);
        
        this.model.find(query.conditions, query.fields, query.options, function (err, data) {
            callback(err, data);
        });
    };

    Store.prototype.get = function (id, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = {};
        }
        var query = parseQuery(params.query);

        this.model.findById(id, query.fields, query.options, function (err, data) {
            callback(err, data);
        });
    };

    Store.prototype.create = function (data, params, callback) {
      // Create our actual Todo object so that we only get what we really want
        var obj = new this.model(data);
        obj.save(function (err, data) {
            //console.log(err, data);
            callback(err, data);
        });
    };

    Store.prototype.update = function (id, data, params, callback) {
        this.model.findByIdAndUpdate(id, data, { upsert: true }, function(err, data) {
            return callback(err, data);
        });
    };

    Store.prototype.remove = function (id, params, callback) {
        this.model.findByIdAndRemove(id, function(err, data) {
            return callback(err, data);
        });
    };

    return new Store(modelName, schema, mongoose);

};
