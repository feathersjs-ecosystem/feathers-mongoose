var mongoose = require('mongoose');

var Todo = {
    schema: {
        title: {type: String, required: true},
        author: {type: String, required: true},
        description: {type: String},
        dueDate: {type: Date, 'default': Date.now},
        complete: {type: Boolean, 'default': false, index: true}
    },
    methods: {
    },
    statics: {
    },
    virtuals: {
    },
    indexes: [
        {'dueDate': -1, background: true}
    ]
};

module.exports = Todo;