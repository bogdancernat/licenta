'use strict';

/**
 * @ngdoc function
 * @name bounceApp.controller:MainController
 * @description
 * # MainController
 * Controller of the bounceApp
 */

angular.module('bounceApp')
  .controller('MainController', function ($scope, $routeParams, $location, $socket, appData) {

    $scope.showRoomSelection  = false;
    $scope.showAliasSelection = true;
    $scope.showRoom           = false;

    $scope.alias = appData.alias;

    $scope.room                 = $routeParams.room_name;
    $scope.roomPassword         = null;
    $scope.roomRequiresPassword = false;


    if (!$scope.alias) {
      $socket.emit('get-alias');
    }

    if (appData.alias && appData.room) {
      // alias and rooma lready set, hide the 2 setup boxes and show application
      $scope.showRoomSelection  = false;
      $scope.showAliasSelection = false;
      $scope.showRoom           = true;
      $scope.peerConnected      = true;
    }

    $scope.takeAlias = function () {
      // disable all alias inputs until we get a response from server
      $scope.aliasDisabled = true;
      $socket.emit('take-alias', {alias: this.alias});
    };

    $scope.enterRoom = function () {
      var socketData = {
        room: this.room,
        alias: this.alias
      };

      // disable all room inputs until we get a response from server
      this.roomDisabled = true;

      if (this.roomRequiresPassword) {
        socketData.password = this.roomPassword;
      }

      $socket.emit('enter-room', socketData);
    };

    $scope.checkRoom = function () {
      $socket.emit('check-room', {room: this.room});
    };

    $socket.on('get-alias:response', function (data) {
      if (data.alias) {
        $scope.alias = data.alias;
      }
    });

    $socket.on('take-alias:response', function (data) {
      // enable alias inputs
      $scope.aliasDisabled = false;

      if (data.ok) {
        $scope.aliasError = null;
        appData.alias = $scope.alias;

        // user selected an alias
        // hide the alias selection box
        $scope.showAliasSelection = false;
        // show the application
        $scope.showRoomSelection  = true;

        if (!$scope.room) {
          $socket.emit('get-room');
        } else {
          $scope.checkRoom();
        }

      } else {
        // there was an error with the user's alias choice
        // show alias error message
        $scope.aliasError = data.error;
      }
    });

    $socket.on('get-room:response', function (data) {
      if (data.room) {
        $scope.room = data.room;
        $scope.checkRoom();
      }
    });

    $socket.on('enter-room:response', function (data) {
      // enable all room inputs
      $scope.roomDisabled = false;

      if (data.ok) {
        appData.room = $scope.room;

        if (!$routeParams.room_name) {
          $location.path('/room/' + $scope.room);
        } else {
          // hide the room selection box
          $scope.showRoomSelection = false;
          // hide the room selection box
          $scope.showRoom = true;
        }
      } else {
        if (data.error) {
          $scope.roomErrorMessage = data.error;
        }
      }
    });

    $socket.on('check-room:response', function (data) {
      if (data.ok) {
        // display the message from the server
        $scope.roomMessage = data.message;
        // hide the room password input
        $scope.roomRequiresPassword = false;
      } else {
        if (data.error) {
          // display room error message
          $scope.roomErrorMessage = data.error;
        }

        if (data.password) {
          $scope.roomPassword = null;
          // show room password input
          $scope.roomRequiresPassword = true;
        }
      }
    });
  });
