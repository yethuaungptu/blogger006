var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var session = require("express-session");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "A;ll@23#456$%^dsddsf",
    resave: false,
    saveUninitialized: true,
  })
);
//remote DB
mongoose.connect(
  "mongodb+srv://zikimi:zikimi@blogger006.2lzvyy4.mongodb.net/?retryWrites=true&w=majority"
);
var db = mongoose.connection;
db.on(
  "error",
  console.error.bind(console, "MongoDB connection error from node11db!!!")
);

app.use(function (req, res, next) {
  res.locals.user = req.session.user;
  next();
});

app.use("/", indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
