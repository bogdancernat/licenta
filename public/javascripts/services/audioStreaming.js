'use strict';

/**
 * @ngdoc service
 * @name bounceApp.audioStreaming
 * @description
 * # audioStreaming
 * Service in the bounceApp.
 */
angular.module('bounceApp')
  .service('audioStreaming', function audioStreaming($socket, $localStorage) {
    var audioContext
    , microphone
    , audioStream
    ;

    function init() {
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContext();
    }

    function startStreaming (callback) {

      navigator.getUserMedia({
        audio: true
      }, function (stream) {
        microphone = audioContext.createMediaStreamSource(stream);
        audioStream = stream;
        // var filter = context.createBiquadFilter();

        // microphone.connect(filter);
        microphone.connect(audioContext.destination);
        callback(null);
      }, function (error) {
        console.error(error);
        callback(error);
      });

    }

    function stopStreaming () {
      if (microphone) {
        microphone.disconnect(0);
      }

      if (audioStream) {
        audioStream.stop();
      }
    }

    return {
      init: init,
      startStreaming: startStreaming,
      stopStreaming: stopStreaming
    };
  });
