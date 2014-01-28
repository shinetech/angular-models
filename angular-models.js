'use strict';

/* Services */

angular.module('shinetech.models', []).factory('Base', function() {
  return {
    extend: function() {
      var args = Array.prototype.slice.call(arguments);
      return angular.extend.apply(null, [{}, this].concat(args));
    },
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
});;