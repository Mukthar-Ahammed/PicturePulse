require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');         
var logger = require('morgan');
var exphbs = require('express-handlebars');
var db = require("./db/connect");
const nocache=require('nocache')
var multer = require('multer');
var session=require('express-session');
var MongoStore = require('connect-mongo');
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var app = express();

//poster and trailer upload, serve the file from the directories..
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/trailer', express.static(path.join(__dirname, 'trailer')));
app.use('/song', express.static(path.join(__dirname, 'song')));



// view engine setup
app.set('views', path.join(__dirname, 'views'));

// Create an instance of express-handlebars
var hbs = exphbs.create({
  extname: 'hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views/layout'),
  partialsDir: path.join(__dirname, 'views/partials'),
});

// Register the handlebars view engine
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(nocache());
app.use(session({secret:'key', resave: false, saveUninitialized: false,cookie:{maxAge:null}}));
db.connect((err) => {
  if (err) {
    console.log("Failed to connect: " + err);
  } else {
    console.log("--No errors--");
  }
});


// Storage for the poster image
const posterStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Folder to save uploaded poster images
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Add timestamp to avoid name conflicts
  }
});

// Storage for the trailer video
const trailerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'trailer/'); // Folder to save uploaded trailer videos
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Add timestamp to avoid name conflicts
  }
});

const songStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'song/'); // Folder to save uploaded trailer videos
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Add timestamp to avoid name conflicts
  }
});




const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.fieldname === 'poster') {
        cb(null, 'uploads/'); 
      } else if (file.fieldname === 'trailer') {
        cb(null, 'trailer/'); // Save trailer in the 'trailer' folder
      } else if (file.fieldname === 'songs') {
        cb(null, 'song/'); // Save song in the 'song' folder
      } 
      else {
        cb(new Error('Unexpected field'));
      }
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)); // Add timestamp to avoid name conflicts
    }
  })
});


app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handlers
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;