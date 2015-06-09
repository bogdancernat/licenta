var crypto   = require('crypto')
, config     = require('../config')
, saltLength = config.crypto.saltLength
;

exports.hashPassword = function (password) {
  var salt = generateSalt(saltLength);
  var hash = makeHash(password + salt);

  return salt + hash;
};

exports.validateHash = function (hash, password) {
  if (typeof password === 'undefined') return false;

  var salt = hash.substr(0, saltLength);
  var validHash = salt + makeHash(password + salt);

  return hash === validHash;
};

function makeHash (string) {
  return crypto.createHash('md5').update(string).digest('hex');
}

function generateSalt (saltLength) {
  var set     = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ'
  , setLength = set.length
  , salt      = ''
  ;

  for (var i = 0; i < saltLength; i++) {
    var p = Math.floor(Math.random() * setLength);
    salt += set[p];
  }

  return salt;
}