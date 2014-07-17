var assert = require('assert');
var mongooseService = require('../lib/mongoose');
var mongoose = require('mongoose');

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
            var service = new mongooseService('test', {
                field: {type: String}
            }, mongoose);
            assert.equal(true, !!service);
            assert.equal(true, !!service.find);
            assert.equal(true, !!service.get);
            assert.equal(true, !!service.create);
            assert.equal(true, !!service.update);
            assert.equal(true, !!service.remove);
        });
    });
});