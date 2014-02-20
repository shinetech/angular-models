'use strict';

/* Services */

angular.module('shinetech.models', []).factory('Base', function() {
  return {
    /**
     * Defines a new mixin with a set of properties. Multiple sets of properties can be provided.
     * If two property sets define the same property name, the last one will take priority.
     *
     * Mixins can extend upon each other.
     */
    extend: function() {
      var args = Array.prototype.slice.call(arguments);
      return angular.extend.apply(null, [{}, this].concat(args));
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
        angular.extend(object, this);

        return object;
      }
    }
  };
}).factory('identityMap',
    /**
     * A simple identity-map implementation. This can be used to ensure that, for some class
     * descriptor and ID, only one instance of a particular object is ever used.
     */
    function() {
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
              angular.extend(mappedObject, object);
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
  );;