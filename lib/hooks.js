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
 * 		`options.`getters apply all getters (path and virtual getters)
 * 		`options.virtuals` apply virtual getters (can override getters option)
 *  	`options.minimize` remove empty objects (defaults to true)
 *   	`options.transform` a transform function to apply to the resulting 
 *   											document before returning
 *    `options.depopulate` depopulate any populated paths, replacing them with 
 *    										 their original refs (defaults to false)
 *    `options.versionKey` whether to include the version key (defaults to true)
 *    `options.retainKeyOrder` keep the order of object keys. If this is set to 
 *    												 true, Object.keys(new Doc({ a: 1, b: 2}).toObject()) 
 *    												 will always produce ['a', 'b'] (defaults to false)
 * @return {Object}  The hook object with the result as a plain js object.
 */
exports.toObject = function(options, fn) {
  if(typeof fn === 'function') {
    throw new Error('Please use the hook as a function.');
  }

  function convert(obj){
    return obj.toObject(options);
  }

  options = options || {};
  return function(hook, next) {
    if (Array.isArray(hook.result)) {
      hook.result = hook.result.map(convert);
    } else {
      hook.result = convert(hook.result);
    }
    return next();
  };
};

