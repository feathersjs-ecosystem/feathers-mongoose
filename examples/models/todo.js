var mongoose = require('mongoose');

var Todo = {
    schema: {
        title: {type: String, required: true},
        description: {type: String},
        dueDate: {type: Date, 'default': Date.now},
        complete: {type: Boolean, 'default': false}
    },
    methods: {
    },
    statics: {
    },
    virtuals: {
    },
    indexes: [
    ]
};

module.exports = Todo;