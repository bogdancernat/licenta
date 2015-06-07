'use strict';

/**
 * @ngdoc function
 * @name bounceApp.controller:PeerPanelController
 * @description
 * # PeerPanelController
 * Controller of the bounceApp
 */

angular.module('bounceApp')
  .controller('PeerPanelController', function ($scope, $routeParams, $location, $socket, $localStorage, videoStreaming, audioStreaming) {

    videoStreaming.init();
    audioStreaming.init();

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

    $socket.on('video-frame', function (frame) {
      videoStreaming.updateReceiverVideoFrame(frame);
    });

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
      if (!$scope.self.videoActive) {
        videoStreaming.startVideo(function (error) {
          if (!error) {
            $scope.self.videoActive = true;
            $scope.$apply();
          } else {
            console.error(error);
          }
        });
      } else {
        videoStreaming.stopVideo();
        $scope.self.videoActive = false;
      }
    }

    function muteReceiverVideo () {
      $scope.receiver.videoMuted = !$scope.receiver.videoMuted;
    }

    function toggleOwnAudio () {
      if (!$scope.self.audioActive) {
        audioStreaming.startStreaming(function (error) {
          if (!error) {
            $scope.self.audioActive = true;
            $scope.$apply();
          }
        });
      } else {
        audioStreaming.stopStreaming();
        $scope.self.audioActive = false;
      }
    }

    function muteReceiverAudio () {
      $scope.receiver.audioMuted = !$scope.receiver.audioMuted;
    }
  });