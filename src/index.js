import * as hooks from './hooks';
import service from './service';

Object.assign(service, { hooks, Service: service.Service });

export default service;
