'use strict';

/**
 * @ngdoc function
 * @name bounceApp.controller:RoomController
 * @description
 * # RoomController
 * Controller of the bounceApp
 */

angular.module('bounceApp')
  .controller('RoomController', function ($scope, $rootScope, $location, $routeParams, $socket, $localStorage, nav) {
    $scope.alias = null;
    $scope.peers = [];

    $rootScope.nav = nav;

    if (!$scope.alias) {
      if ($localStorage.alias) {
        $scope.alias = $rootScope.alias = {
          name: $localStorage.alias.name
        };
      } else {
        $scope.alias = $rootScope.alias = {
          name: null
        };
      }
    }

    if (!$scope.room) {
      $scope.roomJoined = false;

      $scope.room = $rootScope.room = {
        name: $routeParams.room_name,
        error: null,
        message: null,
        password: null,
        requiresPassword: false,
        disabled: false
      };

      checkRoom();

      if ($scope.alias.name) {
        joinRoom();
      }
    } else {
      $scope.roomJoined = true;
    }

    $scope.checkRoom = checkRoom;
    $scope.joinRoom = joinRoom;



    $scope.leaveRoom = function () {
      $socket.emit('leave-room', {room: $rootScope.room.name});
      delete $rootScope.room;
      $scope.$broadcast('leaving-room');
    };

    $scope.redirectRoot = function () {
      delete $rootScope.room;
      $location.path('/');
    };

    $socket.on('check-room:response', function (data) {
      $scope.room.error = data.error;
      $scope.room.message = data.message;
      $scope.room.requiresPassword = data.requiresPassword;
    });

    $socket.on('join-room:response', function (data) {
      $scope.room.disabled = false;

      if (data.error) {
        $scope.room.error = data.error;
        $scope.room.message = null;
      } else {
        $scope.roomJoined = true;
      }
    });

    $socket.on('peer-joined', function (data) {
      if ($scope.peers.indexOf(data.alias) === -1) {
        $scope.peers.push(data.alias);
      }

      $socket.emit('greet-peer', {
        sidPeer: data.sid,
        ownAlias: $scope.alias.name
      })
    });

    $socket.on('peer-said-hi', function (data) {
      if (data.alias) {
        $scope.peers.push(data.alias);
      }
    });

    $socket.on('peer-left', function (data) {
      if ($scope.peers.indexOf(data.alias) !== -1) {
        $scope.peers.splice($scope.peers.indexOf(data.alias), 1);
      }

      $scope.$broadcast('peer-left', data.alias);
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

    // function callPeer (peerName) {
    //   $socket.emit('initiate-call', {
    //     receiver: peerName,
    //     room: $scope.room.name
    //   });
    // }
  });
