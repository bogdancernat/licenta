'use strict';

/**
 * @ngdoc function
 * @name bounceApp.controller:ChatController
 * @description
 * # ChatController
 * Controller of the bounceApp
 */

angular.module('bounceApp')
  .controller('ChatController', function ($scope, $timeout, $rootScope, $routeParams, $location, $socket, $localStorage, nav) {
    $scope.chatMessage = null;

    $scope.messages = {
      room: [],
      private: {},
      receiver: null
    };

    $scope.call = null;

    $scope.initiateCall = initiateCall_step1;
    $scope.rejectCall   = rejectCall;
    $scope.answerCall   = answerCall;
    $scope.endCall      = endCall;

    $scope.switchToRoomChat = switchToRoomChat;
    $scope.privateChat      = privateChat;


    $scope.sendMessage = function () {
      if (this.chatMessage) {
        var socketData = {
          text: this.chatMessage,
          alias: $scope.alias.name,
          room: $scope.room.name,
          receiver: this.messages.receiver,
          time: (new Date).getTime()
        };

        if (!this.messages.receiver) {
          $scope.messages.room.push(socketData);
        } else {
          if (typeof $scope.messages.private[socketData.receiver] === 'undefined') {
            $scope.messages.private[socketData.receiver] = [];
          }

          $scope.messages.private[socketData.receiver].push(socketData);
        }

        $socket.emit('new-message', socketData);

        this.chatMessage = null;
      }
    };

    $socket.on('new-message', function (message) {
      message.text = parseMessage(message.text);

      if (!message.receiver) {
        $scope.messages.room.push(message);
      } else {
        if (typeof $scope.messages.private[message.alias] === 'undefined') {
          $scope.messages.private[message.alias] = [];
        }

        $scope.messages.private[message.alias].push(message);
      }
    });

    $scope.$on('leaving-room', function (event, peer) {
      if ($scope.call) {
        killCall()
      }

      nav.states.peersMenuIsOpen = false;
      nav.states.menuIsOpen = false;
      $location.path('/');
    });

    $scope.$on('peer-left', function (event, peer) {
      if ($scope.call && $scope.call.peer.name === peer) {
        killCall();
      }

      if ($scope.messages.receiver === peer) {
        $scope.messages.receiver = null;
      }

    });

    $socket.on('send-rtc-offer:response', function (data) {
      if (!$scope.call.waiting) return false;
      // got an offer, need my servers
      $scope.call.offer = data.offer;
      $socket.emit('rtc-ice-servers');
    });

    $socket.on('send-ice-candidate:response', function (data) {
      if ($scope.call.connection) {
        var rtcCandidate = new RTCIceCandidate(data.candidate);
        $scope.call.connection.addIceCandidate(rtcCandidate);
      }
    });

    $socket.on('send-rtc-answer:response', function (data) {
      if (!$scope.call.waiting) return false;

      var rtcAnswer = new RTCSessionDescription(data.answer);
      $scope.call.connection.setRemoteDescription(rtcAnswer);
    });

    $socket.on('signal-call:request', function (data) {
      if ($scope.call && ($scope.call.connection || $scope.call.incoming || $scope.call.outgoing || $scope.call.waiting)) {
        $socket.emit('signal-call:busy', {
          peer: data.caller,
          receiver: $scope.alias.name,
          room: $scope.room.name
        });
      } else {
        $scope.call = getCallObjectTemplate();
        $scope.call.peer.name = data.caller;
        $scope.call.incoming = true;
      }

    });

    $socket.on('signal-call:busy', function (data) {
      if ($scope.call.connection || $scope.call.incoming || $scope.call.outgoing || $scope.call.waiting) {
        $scope.call.busy = true;

        $timeout(function () {
          killCall();
        }, 1000);
      }
    });

    $socket.on('signal-call:response', function (data) {
      if (data.accept) {
        // receiver accepted the call request
        $scope.call.waiting = true;

        // get rtc-ice servers
        getRTCServers_step2();
      } else {
        killCall();
      }
    });

    $socket.on('signal-call:cancel-request', function (data) {
      $scope.call = getCallObjectTemplate();
    });

    $socket.on('end-call', endCall);
    // step2 response
    $socket.on('rtc-ice-servers:response', getRTCServersResponse_step2);


    function switchToRoomChat() {
      $scope.messages.receiver = null;
      nav.states.peersMenuIsOpen = false;
    }

    function privateChat (peer) {
      $scope.messages.receiver = peer;
      nav.states.peersMenuIsOpen = false;
    }

    function parseMessage (message) {
      var urlRegex = /(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|ninja|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi

      message = sanitizeStr(message);

      // convert possible links to actual links
      message = message.replace(urlRegex, function (url) {
        var link;

        if(!/^[a-z]+:\/\//ig.test(url)) {
          link = '<a href="//' + url + '" target="_blank">' + url + '</a>';
        } else {
          link = '<a href="' + url + '" target="_blank">' + url + '</a>';
        }

        return link;
      });

      return message;
    }

    function sanitizeStr (str) {
      var tagsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
      };

      return str.replace(/[&<>]/g, replaceTag);

      function replaceTag(tag) {
        return tagsToReplace[tag] || tag;
      }
    }

    function initiateCall_step1 (peer) {
      nav.states.peersMenuIsOpen = false;

      $scope.call = getCallObjectTemplate();
      $scope.call.peer.name = peer;

      AdapterJS.webRTCReady(function (isUsingPlugin) {
        getUserMedia({
          video: true,
          audio: true
        }, function (stream) {

          $scope.call.outgoing = true;
          $scope.call.peer.video        = document.getElementById('receiver-video');
          $scope.call.self.video        = document.getElementById('self-video');
          $scope.call.self.video.volume = 0;
          $scope.call.self.stream       = stream;
          $scope.call.self.streamURL    = window.URL.createObjectURL(stream);;
          $scope.call.self.video.src    = $scope.call.self.streamURL;

          $socket.emit('signal-call', {
            peer: $scope.call.peer.name,
            room: $scope.room.name,
            caller: $scope.alias.name
          });

          $scope.$apply();
        }, function (error) {
          console.error(error);
        });
      });
    }

    function getRTCServers_step2 () {
      if (!$scope.call.waiting) return false;

      $socket.emit('rtc-ice-servers');
    }

    function getRTCServersResponse_step2 (data) {
      if (!$scope.call.waiting) return false;

      if (!data.error) {
        $scope.call.connection = new RTCPeerConnection({
          iceServers: data.result.iceServers
        });

        $scope.call.connection.onicecandidate = onIceCandidate;
        $scope.call.connection.onaddstream    = onAddStream;

        $scope.call.connection.addStream($scope.call.self.stream);

        if ($scope.call.outgoing) {
          createOffer_step3()
        } else {
          // incoming
          createAnswer_step3($scope.call.offer);
        }
      } else {
        console.error(data.error);
      }
    }

    function createOffer_step3() {
      $scope.call.connection.createOffer(function (offer) {
        $scope.call.connection.setLocalDescription(offer);

        $socket.emit('send-rtc-offer', {
          peer: $scope.call.peer.name,
          caller: $scope.alias.name,
          room: $scope.room.name,
          offer: offer
        });
      }, function (error) {
        console.error('error creating offer', error);
      });
    }

    function createAnswer_step3 (offer) {
      var rtcOffer = new RTCSessionDescription(offer);
      $scope.call.connection.setRemoteDescription(rtcOffer);

      $scope.call.connection.createAnswer(function (answer) {
        $scope.call.connection.setLocalDescription(answer);

        $socket.emit('send-rtc-answer', {
          peer: $scope.call.peer.name,
          room: $scope.room.name,
          answer: answer
        });
      }, function (err) {
        console.error(err);
      });
    }

    function onAddStream (event) {
      $scope.call.peer.stream = event.stream;
      $scope.call.peer.video.src = window.URL.createObjectURL(event.stream);
      $scope.call.waiting = false;
      $scope.call.inProgress = true;
      $scope.call.outgoing = false;
      $scope.call.incoming = false;

      $scope.$apply();
    }

    function onIceCandidate (event) {
      if (event.candidate) {
        $socket.emit('send-ice-candidate', {
          peer: $scope.call.peer.name,
          room: $scope.room.name,
          candidate: event.candidate
        });
      }
    }

    function answerCall () {
      if ($scope.call.incoming) {

        AdapterJS.webRTCReady(function (isUsingPlugin) {
          getUserMedia({
            video: true,
            audio: true
          }, function (stream) {
            $scope.call.peer.video        = document.getElementById('receiver-video');
            $scope.call.self.video        = document.getElementById('self-video');
            $scope.call.self.video.volume = 0;
            $scope.call.self.stream       = stream;
            $scope.call.self.streamURL    = window.URL.createObjectURL(stream);;
            $scope.call.self.video.src    = $scope.call.self.streamURL;

            $socket.emit('signal-call:response', {
              peer: $scope.call.peer.name,
              room: $scope.room.name,
              accept: true
            });

            $scope.call.waiting = true;

            $scope.$apply();
          }, function (error) {
            console.error(error);
            rejectCall();
          });
        });
        //get webcam

      }
    }

    function rejectCall () {
      if ($scope.call.incoming) {
        $socket.emit('signal-call:response', {
          peer: $scope.call.peer.name,
          room: $scope.room.name,
          accept: false
        });
      } else {
        // the same person that initiated the call, is canceling
        $socket.emit('signal-call:cancel-request', {
          peer: $scope.call.peer.name,
          room: $scope.room.name
        });

      }

      killCall();
    }

    function endCall () {
      if ($scope.call && $scope.call.inProgress) {
        $socket.emit('end-call', {
          peer: $scope.call.peer.name,
          room: $scope.room.name
        });

        killCall();
      }
    }


    function killCall () {
      try {
        $scope.call.connection.close();
      } catch (e) {
        console.error(e);
      }

      try {
        $scope.call.self.video.src = '';
        $scope.call.self.stream.stop();
      } catch (e) {}

      try {
        $scope.call.peer.video.src = '';
        $scope.call.peer.stream.stop();
      } catch (e) {}

      $scope.call = getCallObjectTemplate();
    }

    function getCallObjectTemplate () {
      return {
        peer: {
          name: null,
          video: null,
          stream: null,
          streamURL: null
        },
        self: {
          video: null,
          stream: null,
          streamURL: null
        },
        connection: null,
        waiting: false,
        busy: false,
        outgoing: false,
        incoming: false,
        inProgress: false,
      };
    }
  });