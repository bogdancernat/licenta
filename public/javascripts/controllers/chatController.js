'use strict';

/**
 * @ngdoc function
 * @name bounceApp.controller:ChatController
 * @description
 * # ChatController
 * Controller of the bounceApp
 */

angular.module('bounceApp')
  .controller('ChatController', function ($scope, $routeParams, $location, $socket, $localStorage) {
    $scope.chatMessage = null;
    $scope.messages = [];

    $scope.sendMessage = function () {
      $socket.emit('new-message', {
        text: this.chatMessage,
        alias: $localStorage.alias.registered,
        room: $localStorage.room.registered,
        time: (new Date).getTime()
      });

      this.chatMessage = null;
    };

    $socket.on('new-message', function (message) {
      $scope.messages.push(message);
    });

  });