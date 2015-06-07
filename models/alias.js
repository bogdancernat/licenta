var mongoose = require('mongoose');

module.exports = mongoose.model('Alias', {
  name: {
    type: String,
    index: {unique: true}
  },
  rooms: [],
  takenBy: String,
  hash: String
});