var config = require('../config')
, fs       = require('fs')
, mongoose = require('mongoose')
;

exports.showIndex = function (req, res) {
  res.render('layout');
};