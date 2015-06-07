var crypto = require('crypto')
, Alias    = require('../models/alias')
, Room     = require('../models/room')
, passwordController = require('./passwordController')
;

exports.connection = function (socket) {
  var ioScope = this;

  socket.on('get-alias', function (data) {
    socket.emit('get-alias:response', {
      alias: crypto.randomBytes(3).toString('hex')
    });
  });

  socket.on('disconnect', function () {
    Alias.findOne({takenBy: socket.id}, function (errAlias, alias) {
      if(alias && alias.rooms.length) {

        for (var i = alias.rooms.length - 1; i >= 0; i--) {
          var room = alias.rooms[i];
          ioScope.to(room).emit('recount-peers');
        };

        alias.rooms = [];
        alias.save();
      }
    });
  });

  socket.on('take-alias', function (data) {
    if (data.alias) {
      var newAliasHash = crypto.randomBytes(128).toString('hex');

      Alias.create({
        name: data.alias,
        hash: newAliasHash,
        takenBy: socket.id
      }, function (err) {
        var returnData = {
          error: null,
          alias: data.alias,
          ok: true
        };

        if (err) {
          returnData.ok = false;

          if (err.code === 11000) {

            if (data.hash) {
              Alias.findOne({name: data.alias}, function (errFind, alias) {
                if (!errFind) {
                  if (alias.hash === data.hash) {
                    returnData.ok = true;
                    returnData.hash = alias.hash;

                    alias.takenBy = socket.id;
                    alias.save();
                  } else {
                    returnData.error = 'Verification failed, generating new alias.';
                    returnData.forceRandomAlias = true;
                  }
                } else {
                  console.error(errFind);
                }
                socket.emit('take-alias:response', returnData);
              });
            } else {
              returnData.error = 'This alias is taken.';
              socket.emit('take-alias:response', returnData);
            }

          } else {
            returnData.error = err.errmsg || 'Error while creating document in db.';
            socket.emit('take-alias:response', returnData);
          }
        } else {
          returnData.hash = newAliasHash;
          socket.emit('take-alias:response', returnData);
        }
      });
    } else {
      socket.emit('take-alias:response', {
        error: 'Please enter an alias.',
        ok: false
      });
    }
  });

  socket.on('enter-room', function (data) {
    var needToRecountPeers = false;
    if (data.room) {

      Room.create({
        name: data.room,
        ownerAlias: data.alias
      }, function (err) {
        var socketData = {
          error: null,
          ok: false
        };
        if (err) {
          if (err.code === 11000) {
            var pearsInRoom = 0;

            try {
              pearsInRoom = Object.keys(ioScope.adapter.rooms[data.room]).length;
            } catch (e) {
              console.log(e);
            }

            // room exists, see if we can join it.
            Room.findOne({name: data.room}, function (errFind, room) {
              if (pearsInRoom > 1) {
                socketData.ok = false;
                socketData.error = "This room is at full capacity right now.";
                socket.emit('enter-room:response', socketData);
              } else {
                if (room.password) {
                  if (data.password) {
                    if (passwordController.validateHash(room.password, data.password)) {
                      // yay, passwords match, permission is granted
                      socket.join(data.room);
                      socketData.ok = true;
                      needToRecountPeers = true;

                    } else {
                      socketData.ok = false;
                      socketData.error = 'Invalid password.';
                    }
                  } else {
                    // no password was received, won't test with undefined value
                    socketData.ok = false;
                    socketData.error = 'Please enter a password for the room.';
                  }
                } else {
                  socket.join(data.room);
                  needToRecountPeers = true;
                  socketData.ok = true;
                }

                if (socketData.ok) {
                  Alias.findOne({takenBy: socket.id}, function (errAlias, alias) {
                    if (alias) {
                      if (alias.rooms.indexOf(data.room) === -1) {
                        alias.rooms.push(data.room);
                        alias.save();
                      }
                    }

                    socket.emit('enter-room:response', socketData);

                    if (needToRecountPeers) {
                      ioScope.to(data.room).emit('recount-peers');
                    }
                  });
                } else {
                  socket.emit('enter-room:response', socketData);

                  if (needToRecountPeers) {
                    ioScope.to(data.room).emit('recount-peers');
                  }
                }
              }


            });
          }
        } else {
          socketData.ok = true;
          socket.join(data.room);

          Alias.findOne({takenBy: socket.id}, function (errAlias, alias) {
            if (alias) {
              if (alias.rooms.indexOf(data.room) === -1) {
                alias.rooms.push(data.room);
                alias.save();
              }
            }

            socket.emit('enter-room:response', socketData);
            ioScope.to(data.room).emit('recount-peers');
          });
        }
      });
    } else {
      socket.emit('enter-room:response', {
        error: 'Please enter a room name.',
        ok: false
      });
    }
  });

  socket.on('get-room', function (data) {
    socket.emit('get-room:response', {
      room: crypto.randomBytes(3).toString('hex')
    });
  });

  socket.on('check-room', function (data) {
    if (data.room) {
      Room.findOne({name: data.room}, function (err, room) {
        if (room) {
          var pearsInRoom = 0;

          try {
            pearsInRoom = Object.keys(ioScope.adapter.rooms[data.room]).length;
          } catch (e) {
            console.log(e);
          }

          if (pearsInRoom > 1) {
            socket.emit('check-room:response', {
              error: 'This room is at full capacity right now.',
              message: null,
              ok: false
            });
          } else {
            if (room.password) {
              socket.emit('check-room:response', {
                error: 'This room requires a password to enter.',
                password: true,
                ok: false
              });
            } else {
              socket.emit('check-room:response', {
                error: null,
                message: 'This room exists and has it\'s doors wide open.',
                ok: true
              });
            }
          }

        } else {
          socket.emit('check-room:response', {
            error: null,
            message: 'This room is available for initialization.',
            ok: true
          });
        }
      });
    } else {
      socket.emit('check-room:response', {
        error: 'Please enter a room name.',
        ok: false
      });
    }
  });

  socket.on('checking-in', function (data) {
    if (data.room && socket.rooms.indexOf(data.room) != -1) {
      socket.broadcast.to(data.room).emit('check-in', {alias: data.alias});
    }
  });

  socket.on('leave-room', function (data) {
    if (data.room && socket.rooms.indexOf(data.room) != -1) {
      socket.leave(data.room);
      socket.broadcast.to(data.room).emit('recount-peers');

      Alias.findOne({takenBy: socket.id}, function (errAlias, alias) {
        if(alias) {
          var roomIndex = alias.rooms.indexOf(data.room);

          if (roomIndex != -1) {
            alias.rooms.splice(roomIndex, 1);
            alias.save();
          }
        }
      });
    }
  });


  // handling data

  socket.on('new-message', function (message) {
    if (message.room) {
      ioScope.to(message.room).emit('new-message', message);
    }
  });

  socket.on('video-frame', function (data) {
    if (data.room) {
      socket.broadcast.to(data.room).emit('video-frame', data.frame);
    }
  });
};

/*
io.to('room_name').emit('something', data)
socket.join('some room');
socket.leave('room');
*/