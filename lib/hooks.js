exports.toObject = function (options = {}, dataField = 'data') {
  return function (hook) {
    // Only perform this if it's used as an after hook.
    if (hook.result) {
      const data = hook.result[dataField] || hook.result;
      let res;

      // Handle multiple mongoose models
      if (Array.isArray(data)) {
        res = data.map((obj) => {
          if (typeof obj.toObject === 'function') {
            return obj.toObject(options);
          }

          return obj;
        });
      } else if (typeof data.toObject === 'function') { // Handle single mongoose models
        res = data.toObject(options);
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
};
