if(!global._babelPolyfill) { require('babel-polyfill'); }

import * as hooks from './hooks';
import service from './service';

Object.assign(service, { hooks, service });

export default service;
