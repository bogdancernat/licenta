'use strict';

/**
 * @ngdoc function
 * @name bounceApp.controller:PeerPanelController
 * @description
 * # PeerPanelController
 * Controller of the bounceApp
 */

angular.module('bounceApp')
  .controller('PeerPanelController', function ($scope, $routeParams, $location, $socket, appData) {
    $scope.self = {
      videoActive: false,
      audioActive: false,
      // videoMuted: false,
      // audioMuted: false
    };

    $scope.receiver = {
      videoActive: false,
      audioActive: false,
      videoMuted: false,
      audioMuted: false
    };

    $scope.toggleVideo = function (target) {
      if (target === 'self') {
        toggleOwnVideo();
      } else if (target === 'receiver') {
        muteReceiverVideo();
      }
    };

    $scope.toggleAudio = function (target) {
      if (target === 'self') {
        toggleOwnAudio();
      } else if (target === 'receiver') {
        muteReceiverAudio();
      }
    };

    function toggleOwnVideo () {
      $scope.self.videoActive = !$scope.self.videoActive;
    }

    function muteReceiverVideo () {
      $scope.receiver.videoMuted = !$scope.receiver.videoMuted;
    }

    function toggleOwnAudio () {
      $scope.self.audioActive = !$scope.self.audioActive;

    }

    function muteReceiverAudio () {
      $scope.receiver.audioMuted = !$scope.receiver.audioMuted;

    }
  });