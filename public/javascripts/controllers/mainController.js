'use strict';

/**
 * @ngdoc function
 * @name bounceApp.controller:MainController
 * @description
 * # MainController
 * Controller of the bounceApp
 */

angular.module('bounceApp')
  .controller('MainController', function ($scope, $routeParams, $location, $socket, $localStorage) {
    $scope.$storage = $localStorage;

    if (!$localStorage.alias) {
      $localStorage.alias = {
        registered: null,
        input: null,
        generated: null,
        disabled: false,
        error: null,
        hash: null
      };
    }

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

    if ($localStorage.alias.hash && $localStorage.alias.registered) {
      takeAlias();
    } else {
      // get random generated alias
      $localStorage.alias.registered = null;
      $socket.emit('get-alias');
    }

    $scope.takeAlias = takeAlias;
    $scope.enterRoom = enterRoom;
    $scope.checkRoom = checkRoom;

    function takeAlias () {
      var socketData = {
        alias: $localStorage.alias.input
      };

      if ($localStorage.alias.generated && $localStorage.alias.hash) {
        socketData.hash = $localStorage.alias.hash;
        socketData.alias = $localStorage.alias.generated;
      };

      $localStorage.alias.disabled = true;
      $socket.emit('take-alias', socketData);
    }

    function enterRoom () {
      var socketData = {
        room: $localStorage.room.input,
        alias: $localStorage.alias.registered
      };

      // disable all room inputs until we get a response from server
      $localStorage.room.disabled = true;

      if ($localStorage.room.requiresPassword && $localStorage.room.password.length) {
        socketData.password = $localStorage.room.password;
      }

      $socket.emit('enter-room', socketData);
    }

    function checkRoom () {
      $socket.emit('check-room', {room: $localStorage.room.input});
    }

    $socket.on('get-alias:response', function (data) {
      if (data.alias) {
        $localStorage.alias.input     = data.alias;
        $localStorage.alias.generated = data.alias;
      }
    });

    $socket.on('take-alias:response', function (data) {
      // enable alias inputs

      if (data.ok) {
        $localStorage.alias.error = null;
        $localStorage.alias.registered = data.alias;
        $localStorage.alias.input = null;
        $localStorage.alias.hash = data.hash;

        if (!$localStorage.room.input) {
          $socket.emit('get-room');
        } else {
          enterRoom();
          // if ($localStorage.room.input !== $routeParams.room_name) {
          //   $localStorage.room.input = $routeParams.room_name;
          // }

          // checkRoom();
        }

      } else {
        // there was an error with the user's alias choice
        // show alias error message
        $localStorage.alias.registered = null;
        $localStorage.alias.hash = null;

        if (data.forceRandomAlias) {
          $socket.emit('get-alias');
        }

        $localStorage.alias.error = data.error;
      }

      $localStorage.alias.disabled = false;
    });

    $socket.on('get-room:response', function (data) {
      if (data.room) {
        $localStorage.room.generated = data.room;
        $localStorage.room.input     = data.room;

        if ($localStorage.room.registered) {
          $localStorage.room.registered = null;
        }

        checkRoom();
      }
    });

    $socket.on('enter-room:response', function (data) {
      if (data.ok) {
        $localStorage.room.registered = $localStorage.room.input;
        $localStorage.room.error   = null;
        $localStorage.room.message = null;
        // $localStorage.room.input   = null;

        $localStorage.room.peersInRoom = [$localStorage.alias.registered];

        // if (!$routeParams.room_name) {
        $location.path('/room/' + $localStorage.room.registered);
        // }
      } else {
        if ($localStorage.room.registered) {
          $localStorage.room.input = $localStorage.room.registered;
          $localStorage.room.registered = null;
          $localStorage.room.peersInRoom = [];
        }

        if (data.error) {
          $localStorage.room.error = data.error;
          $localStorage.room.message = null;
        }
      }

      $localStorage.room.disabled = false;
    });

    $socket.on('check-room:response', function (data) {
      $localStorage.room.error = null;

      if (data.ok) {
        $localStorage.room.message = data.message;
        $localStorage.room.requiresPassword = false;

        if (data.peersInRoom
            && data.peersInRoom.length
              && $routeParams.room_name === $localStorage.room.input) {
          enterRoom();
        }
      } else {
        if ($localStorage.room.registered) {
          $localStorage.room.input = $localStorage.room.registered;
          $localStorage.room.registered = null;
        }

        if (data.error) {
          $localStorage.room.error = data.error;
        }

        if (data.password) {
          $localStorage.room.password = null;
          $localStorage.room.requiresPassword = true;
        }
      }
    });

    $socket.on('recount-peers', function (data) {
      $localStorage.room.peersInRoom = [$localStorage.alias.registered];
      $socket.emit('checking-in', {room: $localStorage.room.registered, alias: $localStorage.alias.registered});
    });

    $socket.on('check-in', function (data) {
      $localStorage.room.peersInRoom.push(data.alias);
    });


  });
