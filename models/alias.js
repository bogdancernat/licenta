var mongoose = require('mongoose');

module.exports = mongoose.model('Alias', {
  name: {
    type: String,
    index: {unique: true}
  },
  takenBy: String
});