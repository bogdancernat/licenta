var mongoose = require('mongoose');

module.exports = mongoose.model('Room', {
  name: {
    type: String,
    index: {unique: true}
  },
  password: String,
  ownerAlias: String,
  occupants: [String]
});