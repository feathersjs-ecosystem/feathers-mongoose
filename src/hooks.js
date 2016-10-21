/**
 * The `toObject` hook converts the response to a plain js object instead of a
 * Mongoose model instance. It can only be used as an `after` hook.
 *
 * This hook is configurable as a function. You can call it with arguments that
 * will be passed to the toObject method on the document.
 * For example: `toObject({serialize: true, virtuals: true})`
 *
 * It can also be called directly, without a configuration, which will use the
 * default options as specified below. For example: `toObject`
 *
 * @param  {Object} options The same options available to Mongoose documents:
 *                          http://mongoosejs.com/docs/api.html#document_Document-toObject
 *    `options.`getters apply all getters (path and virtual getters)
 *    `options.virtuals` apply virtual getters (can override getters option)
 *    `options.minimize` remove empty objects (defaults to true)
 *    `options.transform` a transform function to apply to the resulting
 *                        document before returning
 *    `options.depopulate` depopulate any populated paths, replacing them with
 *                         their original refs (defaults to false)
 *    `options.versionKey` whether to include the version key (defaults to true)
 *    `options.retainKeyOrder` keep the order of object keys. If this is set to
 *                             true, Object.keys(new Doc({ a: 1, b: 2}).toObject())
 *                             will always produce ['a', 'b'] (defaults to false)
 * @return {Object}  The hook object with the result as a plain js object.
 */

export let toObject = function (options = {}, dataField = 'data') {
  return function (hook) {
    // Only perform this if it's used as an after hook.
    if (hook.result) {
      let data = hook.result[dataField] || hook.result;
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
