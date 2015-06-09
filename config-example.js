module.exports = {
  db: 'mongodb://localhost:27017/bounce-dev',
  socketAdapter: {
    host: 'localhost',
    port: 27017,
    db: 'bounce-dev-sockets'
  },
  title: 'Bounce',
  crypto: {
    saltLength: 13
  },
  twilio: {
    sid: 'id',
    auth_token: 'token'
  }
};

// using twilio.com for STUN / TURN servers