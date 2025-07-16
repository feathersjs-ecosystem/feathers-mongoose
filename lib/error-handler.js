"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ERROR = void 0;
const errors = __importStar(require("@feathersjs/errors"));
exports.ERROR = Symbol('feathers-mongoose/error');
const wrap = (error, original) => Object.assign(error, { [exports.ERROR]: original });
const errorHandler = (error) => {
    // If it's already a Feathers error, just reject it as is
    if (error instanceof errors.FeathersError) {
        return Promise.reject(error);
    }
    if (error.code === 11000 || error.code === 11001) {
        // NOTE (EK): Error parsing as discussed in this github thread
        // https://github.com/Automattic/mongoose/issues/2129
        const match1 = error.message.match(/_?([a-zA-Z]*)_?\d?\s*dup key/i);
        const match2 = error.message.match(/\s*dup key:\s*\{\s*:\s*"?(.*?)"?\s*\}/i);
        const key = match1 ? match1[1] : 'path';
        let value = match2 ? match2[1] : 'value';
        if (value === 'null') {
            value = null;
        }
        else if (value === 'undefined') {
            value = undefined;
        }
        error.message = `${key}: ${value} already exists.`;
        error.errors = {
            [key]: value
        };
        return Promise.reject(wrap(new errors.Conflict(error), error));
    }
    if (error.name) {
        switch (error.name) {
            case 'ValidationError':
            case 'ValidatorError':
            case 'VersionError':
                return Promise.reject(wrap(new errors.BadRequest(error), error));
            case 'CastError':
                // If CastError is for an ID field (common patterns), treat as NotFound (invalid ID format)
                if (error.path === '_id' || error.path === 'customid' || error.message.includes('_id') || error.message.includes('Cast to ObjectId failed')) {
                    return Promise.reject(wrap(new errors.NotFound(`No record found for id '${error.value}'`), error));
                }
                return Promise.reject(wrap(new errors.BadRequest(error), error));
            case 'OverwriteModelError':
                return Promise.reject(wrap(new errors.Conflict(error), error));
            case 'MissingSchemaError':
            case 'DivergentArrayError':
                return Promise.reject(wrap(new errors.GeneralError(error), error));
            case 'MongoError':
                return Promise.reject(wrap(new errors.GeneralError(error), error));
        }
    }
    return Promise.reject(error);
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error-handler.js.map