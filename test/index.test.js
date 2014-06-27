var assert = require('assert');
var mongooseService = require('../lib');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var connection = mongoose.connect('mongodb://localhost/test');

describe('Usage', function() {
    
    /*
    // Old usage
    describe('#new(connection)', function() {
        it('should return a new Mongoose Service', function() {

            var service = new mongooseService('test', {
                field: {type: String}
            }, connection);

            if (!!service) {
                // passed
            }
            assert.equal(-1, [1,2,3].indexOf(5));
            assert.equal(-1, [1,2,3].indexOf(0));
        
        });
    });
    */

    describe('Mongoose - Check Connection', function() {
        it('should have a valid connection', function() {
            assert.equal(true, !!connection);
        });
    });

    describe('#new(mongoose)', function() {
        it('should return a new Mongoose Service', function() {
          var UserSchema = new Schema({
            email: {type : String, required : true, index: {unique: true, dropDups: true}},
            firstName: {type : String, required : true},
            lastName: {type : String, required : true},
            age: {type : Number, required : true},
            password: {type : String, required : true, select: false},
            skills: {type : Array, required : true}
          });
          var UserModel = mongoose.model('User', UserSchema);
            var service = new mongooseService(UserModel);
            assert.equal(true, !!service);
            assert.equal(true, !!service.find);
            assert.equal(true, !!service.get);
            assert.equal(true, !!service.create);
            assert.equal(true, !!service.update);
            assert.equal(true, !!service.remove);
        });
    });
});