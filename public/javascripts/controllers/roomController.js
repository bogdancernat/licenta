'use strict';

/**
 * @ngdoc function
 * @name bounceApp.controller:RoomController
 * @description
 * # RoomController
 * Controller of the bounceApp
 */

angular.module('bounceApp')
  .controller('RoomController', function ($scope, $location, $routeParams, $socket, appData) {

    $socket.emit('check-room', {room: $routeParams.room_name});

    $socket.on('check-room:response', function (data) {
      console.log(data);
    });

    $socket.on('get-alias:response', function (data) {
      console.log(data);
    });

    // $socket.on('')
    if (!appData.getRoom()) {
      appData.setRoom();
    }
    // if (!appData.getAlias() || !appData.getRoom()) {
    //   $location.path('/');
    // }
  });
