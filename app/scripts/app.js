'use strict';

angular.module('olcApp', [
  'ui.bootstrap',
  'ngRoute',
  'pasvaz.bindonce'
])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/form', {
        templateUrl: 'views/form.html',
        controller: 'FormCtrl'
      })
      .when('/menu', {
        templateUrl: 'views/menu.html',
        controller: 'MenuCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });