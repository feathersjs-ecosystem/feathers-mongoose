"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseAdapter = exports.MongooseService = void 0;
exports.default = init;
const errors_1 = require("@feathersjs/errors");
const adapter_1 = require("./adapter");
Object.defineProperty(exports, "MongooseAdapter", { enumerable: true, get: function () { return adapter_1.MongooseAdapter; } });
class MongooseService extends adapter_1.MongooseAdapter {
    async find(params) {
        return this._find(params);
    }
    async get(id, params) {
        return this._get(id, params);
    }
    async create(data, params) {
        if (Array.isArray(data) && !this.allowsMulti('create', params)) {
            return Promise.reject(new errors_1.MethodNotAllowed('Can not create multiple entries. Set `multi: ["create"]` or `multi: true` in service options to allow multi-create. Alternatively, pass `params.adapter.multi` to allow multi-create for this request.'));
        }
        return this._create(data, params);
    }
    async update(id, data, params) {
        return this._update(id, data, params);
    }
    async patch(id, data, params) {
        return this._patch(id, data, params);
    }
    async remove(id, params) {
        return this._remove(id, params);
    }
}
exports.MongooseService = MongooseService;
function init(options) {
    return new MongooseService(options);
}
//# sourceMappingURL=service.js.map