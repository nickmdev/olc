'use strict';

angular.module('olcApp')
  .directive('ngTap', function () {
	  return function(scope, element, attrs) {
		element.bind('touchstart', function() {
		  scope.$apply(attrs['ngTap']);
		});
	  };
  });
