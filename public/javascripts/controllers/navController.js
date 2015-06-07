'use strict';

/**
 * @ngdoc function
 * @name bounceApp.controller:NavController
 * @description
 * # NavController
 * Controller of the bounceApp
 */

angular.module('bounceApp')
  .controller('NavController', function ($scope, $routeParams, $location, $socket, $localStorage) {
    $scope.menuIsOpen = false;

    $scope.toggleMenu = function () {
      this.menuIsOpen = !this.menuIsOpen;
    };

    $scope.killAlias = killAlias;
    $scope.leaveRoom = leaveRoom;

    function killAlias () {
      $localStorage.alias.registered = null;
      $localStorage.alias.hash       = null;
      $socket.emit('get-alias');

      $localStorage.alias = {
        registered: null,
        input: null,
        generated: null,
        disabled: false,
        error: null,
        hash: null
      };

      leaveRoom();
    }

    function leaveRoom () {
      var room = $localStorage.room.registered;

      $localStorage.room = {
        registered: null,
        input: null,
        generated: null,
        password: null,
        disabled: false,
        requiresPassword: false,
        peersInRoom: [],
        error: null,
        message: null
      };

      $socket.emit('leave-room', {room: room});
      $socket.emit('get-room');
      $location.path('/');
    }
  });