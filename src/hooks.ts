import { HookContext } from '@feathersjs/feathers';
import { Document } from 'mongoose';

interface ToObjectOptions {
  [key: string]: any;
}

export function toObject(options: ToObjectOptions = {}, dataField = 'data') {
  return function (hook: HookContext) {
    // Only perform this if it's used as an after hook.
    if (hook.result) {
      const data = hook.result[dataField] || hook.result;
      let res: any;

      // Handle multiple mongoose models
      if (Array.isArray(data)) {
        res = data.map((obj: any) => {
          if (typeof obj.toObject === 'function') {
            return (obj as Document).toObject(options);
          }

          return obj;
        });
      } else if (typeof data.toObject === 'function') { // Handle single mongoose models
        res = (data as Document).toObject(options);
      }

      // If our data is transformed set it to appropriate location on the hook
      if (res) {
        if (hook.result[dataField]) {
          hook.result[dataField] = res;
        } else {
          hook.result = res;
        }
      }
    }
  };
}
