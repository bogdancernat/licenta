'use strict';

/**
 * @ngdoc function
 * @name bounceApp.controller:RoomController
 * @description
 * # RoomController
 * Controller of the bounceApp
 */

angular.module('bounceApp')
  .controller('RoomController', function ($scope, $location, $routeParams, $socket, $localStorage, videoStreaming) {
    if (!$localStorage.room.input) {
      $localStorage.room.input = $routeParams.room_name;
    }

    if (!$localStorage.room.registered && $localStorage.alias.registered) {
      $scope.enterRoom();
    }

    $socket.on('peer-connected', function (data) {
      console.log(data);
      if (data.peersInRoom) {
        $localStorage.room.peersInRoom = data.peersInRoom;
      }
    });

    $socket.on('peer-disconnected', function (data) {
      videoStreaming.stopOwnVideo();
    });

  });
