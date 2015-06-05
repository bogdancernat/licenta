var crypto = require('crypto')
, Alias    = require('../models/alias')
, Room     = require('../models/room')
, passwordController = require('./passwordController')
;

exports.connection = function (socket) {
  console.log('new connection from: ' + socket.id)
  socket.on('get-alias', function (data) {
    socket.emit('get-alias:response', {
      alias: crypto.randomBytes(3).toString('hex')
    });
  });

  socket.on('disconnect', function () {
    Alias.remove({
      takenBy: socket.id
    }, function (err, result) {
      // don't really care about this
    });
  });

  socket.on('take-alias', function (data) {
    if (data.alias) {
      Alias.create({
        name: data.alias,
        takenBy: socket.id
      }, function (err, alias) {
        var returnData = {
          error: null,
          ok: true
        };

        if (err) {
          returnData.ok = false;

          if (err.code === 11000) {
            returnData.error = 'This alias is taken.';
          } else {
            returnData.error = err.errmsg || 'Error while creating document in db.';
          }
        }
        socket.emit('take-alias:response', returnData);
      });
    } else {
      socket.emit('take-alias:response', {
        error: 'Please enter an alias.',
        ok: false
      });
    }
  });

  socket.on('enter-room', function (data) {
    if (data.room) {
      Room.create({
        name: data.room,
        ownerAlias: data.alias,
        occupants: [data.alias]
      }, function (err) {
        var socketData = {
          error: null,
          ok: false
        };
        if (err) {
          if (err.code === 11000) {
            // room exists, see if we can join it.
            // meh, get the room

            Room.findOne({name: data.room}, function (errFind, room) {
              if (room.password) {
                if (data.password) {
                  if (passwordController.validateHash(room.password, data.password)) {
                    // yay, passwords match, permission is granted
                    socketData.ok = true;
                  } else {
                    socketData.ok = false;
                    socketData.error = 'Invalid password.';
                  }
                } else {
                  // no password was received, won't test with null value
                  socketData.ok = false;
                  socketData.error = 'Please enter a password for the room.';
                }
              } else {
                // maybe duplicate? it's possible...
                if (room.occupants.indexOf(data.alias) === -1) {
                  room.occupants.push(data.alias);
                }

                room.save();
                socketData.ok = true;
              }

              socket.emit('enter-room:response', socketData);
            });
          }
        } else {
          socketData.ok = true;
          socket.emit('enter-room:response', socketData);
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
};

/*
io.to('room_name').emit('something', data)
socket.join('some room');
socket.leave('room');
*/