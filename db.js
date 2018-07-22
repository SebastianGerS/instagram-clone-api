var mongoose = require('mongoose');
var config = require('./config');

mongoose.connect("mongodb://" + config.dbUsername + ":" + config.dbPassword + config.db);

mongoose.connection.on('error', function (error) {
  if (error) console.log('error while trying to connect to database');
});