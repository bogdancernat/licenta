var crypto = require('crypto')
, Alias    = require('../models/alias')
, Room     = require('../models/room')
, config   = require('../config')
, twilio   = require('twilio')(config.twilio.sid, config.twilio.auth_token)
, passwordController = require('./passwordController')
;

exports.connection = function (socket) {
  var ioScope = this;

  // better sockets

  socket.on('leave-room', function (data) {
    if (data.room) {
      Room.findOne({'peers.sid': socket.id}, function (errRoom, room) {
        if(room) {
          for (var i = room.peers.length - 1; i >= 0; i--) {
            if (room.peers[i].sid === socket.id) {
              var alias = room.peers[i].alias;

              room.peers.splice(i, 1);
              room.save();
              socket.broadcast.to(data.room).emit('peer-left', {
                sid: socket.id,
                alias: alias
              });
              socket.leave(data.room);
              socket.leave(alias + ':' + data.room);
              break;
            }
          };
        }
      });
    }
  });

  socket.on('check-room', function (data) {
    var socketResponse = {
      error: null,
      message: null,
      requiresPassword: false
    };

    if (data.room) {
      Room.findOne({name: data.room}, function (err, room) {
        if (room) {
          if (room.password) {
            socketResponse.error = 'This room requires a password to enter.';
            socketResponse.requiresPassword = true;
          } else {
            socketResponse.message = 'This room exists, come on in.'
          }
        } else {
          socketResponse.message = 'This room is ready to be created.';
        }

        socket.emit('check-room:response', socketResponse);
      });
    } else {
      socketResponse.error = "Please enter a room name";
      socket.emit('check-room:response', socketResponse);
    }
  });

  socket.on('join-room', function (data) {
    var socketResponse = {
      error: null
    };

    if (!data.alias) {
      socketResponse.error = "Please enter an alias";
      socket.emit('join-room:response', socketResponse);
      return;
    }

    if (!data.room) {
      socketResponse.error = "Please enter a room name";
      socket.emit('join-room:response', socketResponse);
      return;
    }

    Room.create({
      name: data.room,
      peers: [{
        sid: socket.id,
        alias: data.alias
      }]
    }, function (errCreate) {
      if (errCreate) {
        if (errCreate.code === 11000) {
          // duplicate, already exists so just connect
          Room.findOne({name: data.room}, function (errFind, room) {
            if (room.password) {
              if (passwordController.validateHash(room.password, data.password)) {
                // yay, passwords match, permission is granted
                socket.join(data.room);
                socket.join(data.alias + ':' + data.room);
                socket.broadcast.to(data.room).emit('peer-joined', {
                  sid: socket.id,
                  alias: data.alias
                });
              } else {
                socketData.error = 'Invalid password.';
              }
            } else {
              var existingAlias = false;
              var sameAlias = null;

              if (room.peers && room.peers.length) {
                sameAlias = room.peers.filter(function (peer) {
                  return peer.alias === data.alias;
                }).pop();
              }

              if (sameAlias) {
                if (ioScope.sockets[0].adapter.sids[sameAlias.sid] !== undefined) {
                  existingAlias = true;
                } else {
                  // socket is not connected to the app
                  room.peers = room.peers.filter(function (peer) {
                    return peer.alias !== data.alias;
                  });
                }
              }

              if (existingAlias) {
                socketResponse.error = "Alias already exists in room, please choose another.";
              } else {
                room.peers.push({
                  sid: socket.id,
                  alias: data.alias
                });
                room.save();
                socket.join(data.room);
                socket.join(data.alias + ':' + data.room);
                socket.broadcast.to(data.room).emit('peer-joined', {
                  sid: socket.id,
                  alias: data.alias
                });
              }
            }

            socket.emit('join-room:response', socketResponse);
          });
        } else {
          // other error, don't connect
          socketResponse.error = 'There was an error with the DB.';
          socket.emit('join-room:response', socketResponse);
        }
      } else {
        // room created
        socket.join(data.room);
        socket.join(data.alias + ':' + data.room);
        socket.broadcast.to(data.room).emit('peer-joined', {
          sid: socket.id,
          alias: data.alias
        });
        socket.emit('join-room:response', socketResponse);
      }
    });
  });

  socket.on('disconnect', function () {
    Room.findOne({'peers.sid': socket.id}, function (errRoom, room) {
      if(room) {
        for (var i = room.peers.length - 1; i >= 0; i--) {
          if (room.peers[i].sid === socket.id) {
            socket.broadcast.to(room.name).emit('peer-left', {
              sid: socket.id,
              alias: room.peers[i].alias
            });
            room.peers.splice(i, 1);
            room.save();
            break;
          }
        };
      }
    });
  });

  socket.on('greet-peer', function (data) {
    if (data.sidPeer && data.ownAlias) {
      socket.to(data.sidPeer).emit('peer-said-hi', {alias: data.ownAlias});
    }
  });
  // handling data

  socket.on('new-message', function (message) {
    if (message.room) {
      if (message.receiver) {
        ioScope.to(message.receiver + ':' + message.room).emit('new-message', message);
      } else {
        socket.broadcast.to(message.room).emit('new-message', message);
      }
    }
  });

  // handling calls

  socket.on('signal-call', function (data) {
    ioScope.to(data.peer + ':' + data.room).emit('signal-call:request', data);
  });

  socket.on('signal-call:response', function (data) {
    ioScope.to(data.peer + ':' + data.room).emit('signal-call:response', data);
  });

  socket.on('signal-call:cancel-request', function (data) {
    ioScope.to(data.peer + ':' + data.room).emit('signal-call:cancel-request', data);
  });

  socket.on('signal-call:busy', function (data) {
    ioScope.to(data.peer + ':' + data.room).emit('signal-call:busy', data);
  });

  socket.on('rtc-ice-servers', function () {
    twilio.tokens.create(function (err, response) {
      var socketResponse = {
        error: null,
        result: null
      };

      if (!err) {
        socketResponse.result = response;
      } else {
        console.error(err);
        socketResponse.error = err;
      }

      socket.emit('rtc-ice-servers:response', socketResponse);
    })
  });


  socket.on('send-ice-candidate', function (data) {
    ioScope.to(data.peer + ':' + data.room).emit('send-ice-candidate:response', data);
  });

  socket.on('send-rtc-offer', function (data) {
    ioScope.to(data.peer + ':' + data.room).emit('send-rtc-offer:response', data);
  });

  socket.on('send-rtc-answer', function (data) {
    ioScope.to(data.peer + ':' + data.room).emit('send-rtc-answer:response', data);
  });

  socket.on('end-call', function (data) {
    ioScope.to(data.peer + ':' + data.room).emit('end-call', data);
  });
};