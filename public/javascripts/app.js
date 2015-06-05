'use strict';


/**
 * @ngdoc overview
 * @name bounceApp
 * @description
 * # bounceApp
 *
 * Main module of the application.
 */

angular
  .module('bounceApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngSocket'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '/javascripts/views/index.html',
        controller: 'MainController'
      })
      .when('/room/:room_name', {
        templateUrl: '/javascripts/views/index.html',
        controller: 'MainController'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
