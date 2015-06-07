'use strict';

/**
 * @ngdoc service
 * @name bounceApp.videoStreaming
 * @description
 * # videoStreaming
 * Service in the bounceApp.
 */
angular.module('bounceApp')
  .service('videoStreaming', function videoStreaming($socket, $localStorage) {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

    var selfVideo = {
      video: null,
      canvas: null,
      context: null,
      ghostCanvas: null,
      ghostContext: null,
      stream: null,
      streamImageSquare: [0, 0, 1, 1], // will be overwritten
      interval: null,
      aspectRatio: 1.0 // will be overwritten
    };

    var receiverVideo = {
      canvas: null,
      context: null
    };

    window.addEventListener('onresize', function () {
      setCanvasSize(selfVideo.canvas);
      setCanvasSize(receiverVideo.canvas);
    }, false);

    function init () {
      selfVideo.video   = document.createElement('video');
      selfVideo.canvas  = document.getElementById('self-video');
      selfVideo.context = selfVideo.canvas.getContext('2d');
      setCanvasSize(selfVideo.canvas);

      selfVideo.ghostCanvas  = document.createElement('canvas');
      selfVideo.ghostContext = selfVideo.ghostCanvas.getContext('2d');

      receiverVideo.canvas  = document.getElementById('receiver-video');
      setCanvasSize(receiverVideo.canvas);
      receiverVideo.context = receiverVideo.canvas.getContext('2d');
    }

    function setCanvasSize (canvasElement) {
      canvasElement.width  = canvasElement.scrollWidth;
      canvasElement.height = canvasElement.scrollHeight;
    }

    function startOwnVideo (callback) {
      if (navigator.getUserMedia) {
        navigator.getUserMedia({
          video: true
        }, function (stream) {
            selfVideo.stream = stream;
            selfVideo.video.src = window.URL.createObjectURL(stream);

            selfVideo.video.addEventListener("loadedmetadata", function (e) {
              selfVideo.aspectRatio = this.videoWidth / this.videoHeight;

              selfVideo.ghostCanvas.width  = this.videoWidth;
              selfVideo.ghostCanvas.height = this.videoHeight;

              if (selfVideo.aspectRatio > 1) {
                selfVideo.streamImageSquare = [
                  (this.videoWidth - this.videoHeight) / 2,
                  0,
                  this.videoHeight,
                  this.videoHeight
                ];
              } else if (selfVideo.aspectRatio < 1) {
                selfVideo.streamImageSquare = [
                  0,
                  (this.videoHeight - this.videoWidth) / 2,
                  this.videoWidth,
                  this.videoWidth
                ];
              } else {
                selfVideo.streamImageSquare = [0, 0, this.videoWidth, this.videoHeight];
              }
              selfVideo.video.play();
            }, false );

            selfVideo.video.addEventListener('play', function () {
              // video cap at 30fps?
              selfVideo.interval = setInterval(function () {
                if (selfVideo.video.paused || selfVideo.video.ended) {
                  return;
                }

                // selfVideo.context.fillRect(0, 0, selfVideo.canvas.width, selfVideo.canvas.height);
                selfVideo.context.drawImage(selfVideo.video,
                                            selfVideo.streamImageSquare[0], selfVideo.streamImageSquare[1], selfVideo.streamImageSquare[2], selfVideo.streamImageSquare[3],
                                            0, 0, selfVideo.canvas.width, selfVideo.canvas.height);
                selfVideo.ghostContext.drawImage(selfVideo.video, 0, 0, selfVideo.ghostCanvas.width, selfVideo.ghostCanvas.height);

                $socket.emit('video-frame', {
                  room: $localStorage.room.registered,
                  frame: selfVideo.ghostCanvas.toDataURL("image/jpeg")
                });
              }, 1000 / 30);
            }, false);

            callback(null);
        }, function (error) {
          callback(error.name || error);
        });
      }
    }

    function updateReceiverVideoFrame (frame) {
      var image = new Image();

      image.onload = function () {
        var aspectRatio = this.width / this.height;

        if (aspectRatio > 1) {
          receiverVideo.context.drawImage(
            image,
            (this.width - this.height) / 2, 0, this.height, this.height,
            0, 0, receiverVideo.canvas.width, receiverVideo.canvas.height);
        } else if (aspectRatio < 1) {
          streamImageSquare = [
            0,
            (this.videoHeight - this.videoWidth) / 2,
            this.videoWidth,
            this.videoWidth
          ];
          receiverVideo.context.drawImage(
            image,
            0, (this.height - this.width) / 2, this.width, this.width,
            0, 0, receiverVideo.canvas.width, receiverVideo.canvas.height);
        } else {
          receiverVideo.context.drawImage(image, 0, 0, receiverVideo.canvas.width, receiverVideo.canvas.height);
        }
      };

      image.src = frame;
    }

    function stopOwnVideo () {
      if (selfVideo.video) {
        selfVideo.video.pause();
        selfVideo.video.src = '';
      }

      if (selfVideo.stream) {
        selfVideo.stream.stop();
      }

      if (selfVideo.interval) {
        clearInterval(selfVideo.interval);
      }

      if (selfVideo.context) {
        selfVideo.context()
      }
    }

    return {
      init : init,
      startVideo : startOwnVideo,
      stopVideo : stopOwnVideo,
      updateReceiverVideoFrame : updateReceiverVideoFrame,
    };
  });
