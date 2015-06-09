var express     = require('express')
, path          = require('path')
, favicon       = require('serve-favicon')
, logger        = require('morgan')
, cookieParser  = require('cookie-parser')
, bodyParser    = require('body-parser')

, session       = require('express-session')
, config        = require('./config')
, MongoStore    = require('connect-mongo')({ session: session })
, mongoose      = require('mongoose')
, routes        = require('./routes/index')

, app           = express()
;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
  secret: 'hsc4nasyxpiudf47ss4y',
  resave: false, //don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  unset: 'destroy',
  store: new MongoStore({
    url: config.db,
    autoReconnect: true,
    autoRemove: 'interval',
    autoRemoveInterval: 30, // minutes
    ttl: 1 * 24 * 60 * 60 // = 1 day
  })
}));


mongoose.connect(config.db);
mongoose.connection.on('error', function () {
  console.error('Mongo DB connection problem! Check your logs!');
});

// passport.use(new LocalStrategy({
//   usernameField: 'email',
//   passwordField: 'password',
//   passReqToCallback: true
// }, authController.localStrategy));

// passport.serializeUser(function (user, done) {
//   done(null, user);
// });

// passport.deserializeUser(function (user, done) {
//   done(null, user)
// });

// app.use(passport.initialize());
// app.use(passport.session());

if (process.env.NODE_ENV === 'development') {
  app.use(require('node-compass')({mode: 'expanded'}));
}

app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


app.locals.moment = require('moment');
app.locals.title  = config.title;

module.exports = app;
