var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var TagSchema = Schema({
  tagname: String,
});

mongoose.model('Tag', TagSchema);

module.exports = mongoose.model('Tag');