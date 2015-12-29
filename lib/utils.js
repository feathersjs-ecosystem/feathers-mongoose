'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.errorHandler = errorHandler;

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function errorHandler(error) {
  var feathersError = error;

  console.error('ERROR', error);

  if (error.constructor.name && (error.constructor.name === 'WLValidationError' || error.constructor.name === 'WLUsageError')) {
    var e = error.toJSON();
    var data = _extends({ errors: error.errors }, e);

    feathersError = new _feathersErrors2.default.BadRequest(e.summary, data);
  } else if (error.message) {
    switch (error.message) {
      case _mongoose2.default.errors.ValidationError.toString():
        feathersError = new _feathersErrors2.default.BadRequest(error);
        break;
    }
  }

  throw feathersError;
}