var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var UserController = require('./controllers/UserController');
var AuthController = require('./controllers/AuthController');
var MediaItemController = require('./controllers/MediaItemController');
var CommentController = require('./controllers/CommentController');
var db = require('./db');
var config = require('./config');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
// view engine setup

app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb',extended: false }));
app.use(cookieParser());
app.use(function(req,res,next){
  res.header('Access-Control-Allow-Origin', config.allowOrigin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', ['Content-Type', 'x-access-token']);

  next();
});
app.use(express.static('public'));

app.use('/users', UserController);
app.use('/auth', AuthController);
app.use('/mediaitems', MediaItemController);
app.use('/mediaitems/:mediaItemId/comments', CommentController);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
