'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.service = exports.mongoose = exports.hooks = undefined;

var _hooks = require('./hooks');

var hooks = _interopRequireWildcard(_hooks);

var _service = require('./service');

var _service2 = _interopRequireDefault(_service);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.hooks = hooks;
exports.mongoose = _mongoose2.default;
exports.service = _service2.default;
exports.default = _service2.default;