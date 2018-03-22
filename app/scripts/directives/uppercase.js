'use strict';

/**
 * @ngdoc directive
 * @name olcApp.directive:uppercase
 * @description
 * # uppercase
 */
angular.module('olcApp')
  .directive('uppercase', function () {
   return {
     require: 'ngModel',
     link: function(scope, element, attrs, modelCtrl) {
				if(attrs.uppercase === 'Y') {
					var capitalize = function(inputValue) {
						 if(inputValue == undefined) inputValue = '';
						 var capitalized = inputValue.toUpperCase();
						 if(capitalized !== inputValue) {
								modelCtrl.$setViewValue(capitalized);
								modelCtrl.$render();
							}         
							return capitalized;
					 }
					 modelCtrl.$parsers.push(capitalize);
					 capitalize(scope[attrs.ngModel]);  // capitalize initial value
				}
     }
   };
  });
