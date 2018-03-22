'use strict';

/**
 * @ngdoc directive
 * @name olcApp.directive:focusClear
 * @description
 * # focusClear
 */
angular.module('olcApp')
  .directive('focusClear', [function () {
    return {
        restrict: "A",
        link: function (scope, element) {
            var el = $(element);
            el.focus(function () {
                this.select(); //no jquery wrapper
            }).mouseup(function (e) {
                e.preventDefault();
            });

        }
    };
}]);