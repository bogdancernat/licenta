'use strict';

/**
 * @ngdoc function
 * @name bounceApp.controller:IndexController
 * @description
 * # IndexController
 * Controller of the bounceApp
 */

angular.module('bounceApp')
  .controller('IndexController', function ($scope, $rootScope, $routeParams, $location, $socket, $localStorage) {
    $scope.$storage = $localStorage;

    $rootScope.room = {
      name: null,
      error: null,
      message: null,
      password: null,
      requiresPassword: false,
      disabled: false
    };

    $rootScope.alias = {
      name: null
    };


    $scope.room = $rootScope.room;
    $scope.alias = $rootScope.alias;

    if (!$localStorage.alias) {
      $localStorage.alias = {
        name: null
      };
    } else {
      $scope.alias.name = $localStorage.alias.name;
    }

    $scope.checkRoom = checkRoom;
    $scope.joinRoom = joinRoom;

    $socket.on('check-room:response', function (data) {
      $scope.room.error = data.error;
      // $scope.room.message = data.message;
      $scope.room.requiresPassword = data.requiresPassword;
    });

    $socket.on('join-room:response', function (data) {
      $scope.room.disabled = false;

      if (data.error) {
        $scope.room.error = data.error;
        // $scope.room.message = null;
      } else {
        $localStorage.alias.name = $scope.alias.name;
        $location.path('/room/' + $scope.room.name);
      }
    });

    function checkRoom() {
      $socket.emit('check-room', {room: $scope.room.name});
    }

    function joinRoom() {
      $scope.room.disabled = true;

      $socket.emit('join-room', {
        room: $scope.room.name,
        alias: $scope.alias.name,
        password: $scope.room.password
      });
    }
  });