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
    'ngSocket',
    'ngStorage',
    'angularMoment'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '/javascripts/views/index.html',
        controller: 'IndexController'
      })
      .when('/room/:room_name', {
        templateUrl: '/javascripts/views/room.html',
        controller: 'RoomController'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
