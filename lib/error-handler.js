'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = errorHandler;

var _feathersErrors = require('feathers-errors');

var _feathersErrors2 = _interopRequireDefault(_feathersErrors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function errorHandler(error) {
  var feathersError = error;

  if (error.constructor.name === 'MongooseError' && error.name) {
    switch (error.name) {
      case 'ValidationError':
      case 'ValidatorError':
      case 'CastError':
      case 'VersionError':
        feathersError = new _feathersErrors2.default.BadRequest(error);
        break;
      case 'OverwriteModelError':
        feathersError = new _feathersErrors2.default.Conflict(error);
        break;
      case 'MissingSchemaError':
      case 'DivergentArrayError':
        feathersError = new _feathersErrors2.default.GeneralError(error);
        break;
    }
  }

  throw feathersError;
}
module.exports = exports['default'];