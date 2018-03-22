'use strict';

angular.module('olcApp')
  .directive('hasFocus', function ($timeout, $parse) {
	return {
    link: function(scope, element, attrs) {
      var model = $parse(attrs.hasFocus);
      scope.$watch(model, function(value) {
        //console.log('value=',value);
        if(value === true) { 
          $timeout(function() {
            element[0].focus(); 
          });
        }
      });
      element.bind('blur', function() {
         scope.$apply(model.assign(scope, false));
      });
    }
  };
  });
