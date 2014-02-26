/* Services */

angular.module('shinetech.models', []).factory('extend',
  /**
   * A custom object extension method that copies property getter function definitions across from
   * the source to the target, rather than trying to just evaluate the property on the source and
   * copying that across.
   *
   * Otherwise takes the same arguments as `angular.extend`.
   */
  function() {
    return function extend(dst) {
      angular.forEach(arguments, function(obj){
        if (obj !== dst) {
          for (key in obj) {
            var propertyDescriptor = Object.getOwnPropertyDescriptor(obj, key);

            // If we encounter a getter function,
            if (propertyDescriptor && propertyDescriptor.get) {
              // Manually copy the definition across rather than doing a regular copy, as the latter
              // approach would result in the getter function being evaluated. Need to make it
              // enumerable so subsequent mixins pass through the getter.
              Object.defineProperty(
                dst, key, {get: propertyDescriptor.get, enumerable: true, configurable: true}
              );
            } else {
              // Otherwise, just do a regular copy
              dst[key] = obj[key];
            }
          };
        }
      });

      return dst;
    };
  }
).factory('Base',
  /**
   * A base mixin that other mixins can extend upon. Provides basic infrastructure for defining new
   * mixins (`extend`) and mixing them into objects (`mixInto`).
   */
  function(extend) {
    return {
      /**
       * Defines a new mixin with a set of properties. Multiple sets of properties can be provided.
       * If two property sets define the same property name, the last one will take priority.
       *
       * Mixins can extend upon each other.
       */
      extend: function() {
        var args = Array.prototype.slice.call(arguments);
        return extend.apply(null, [{}, this].concat(args));
      },
      /**
       * Mixes the properties of this mixin into an object. If the mixin defines a beforeMixingInto
       * method, that will get called _before_ the mixing occurs.
       *
       * The first argument is the object to mix into. This will also be passed to beforeMixingInto.
       * If any subsequent arguments are provided, they will also be passed to beforeMixingInto.
       */
      mixInto: function() {
        var object = arguments[0];
        // If we're actually mixing into something,
        if (object) {
          // If we've got some mixing customization todo, then invoke it
          if (this.beforeMixingInto) this.beforeMixingInto.apply(this, arguments);

          // Always do this
          extend(object, this);

          return object;
        }
      }
    };
  }
).factory('identityMap',
    /**
     * A simple identity-map implementation. This can be used to ensure that, for some class
     * descriptor and ID, only one instance of a particular object is ever used.
     */
    function(extend) {
      var identityMap = {};
      /*
       * Identity-maps an object. This means that:
       *
       * - If an object with the same class and ID already exists in the map, the new object will be
       *   merged into the existing one, and the existing object returned.
       * - If an object with the same class and ID does _not_already exist in the map, it will be
       *   stored in the map and returned
       *
       * @param  {String} className a string descriptor of the class of the object
       * @param  {Object} object the object to be mapped
       * @return {Object} the identity-mapped object
       */
      return function(className, object) {
        if (object) {
          var mappedObject;
          if (identityMap[className]) {
            mappedObject = identityMap[className][object.id];
            if (mappedObject) {
              extend(mappedObject, object);
            } else {
              identityMap[className][object.id] = object;
              mappedObject = object;
            }
          } else {
            identityMap[className] = {};
            identityMap[className][object.id] = object;
            mappedObject = object;
          }
          return mappedObject;
        }
      };
    }
  );