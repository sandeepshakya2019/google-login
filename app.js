//jshint esversion:6
require('dotenv').config();
// require the npm packages
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
// defining the app instance
const app = express();
// console.log("1");
// to use the puclic files like css, js
app.use(express.static("public"));
// to use the view engine ejs (embedded java script)
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
// using the session 
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));
// initialize the passport and passport session
app.use(passport.initialize());
app.use(passport.session());
// connection with mongoDB and use the database UserDB
mongoose.connect("mongodb://localhost:27017/googleDB", {useNewUrlParser: true,useUnifiedTopology: true});
// below link is for connect the mongoDB cloud platform
//mongoose.connect("mongodb+srv://<username>:<password>@cluster0.xwnyq.mongodb.net/googleDB?retryWrites=true&w=majority", {useNewUrlParser: true , useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);
// making the schema
const userSchema = new mongoose.Schema ({
  name: String,
  googleId: String,
});
// console.log("2");
// use the passport plugin
userSchema.plugin(passportLocalMongoose);
// use the plugin findOrCreate
userSchema.plugin(findOrCreate);

// making a collection called users
const User = new mongoose.model("User", userSchema);
// console.log("3");
// creating the startegy
passport.use(User.createStrategy());
// serializing the user
passport.serializeUser(function(user, done) {
  // console.log("4");
  
  done(null, user.id);

});
// desearliczed the user
passport.deserializeUser(function(id, done) {
  // console.log("5");
  User.findById(id, function(err, user) {
    // console.log("6");
    done(err, user);
    // console.log("7");
  });
});
// making the google startegy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile.displayName);
    
    //
    User.findOrCreate({ name:profile.displayName,googleId: profile.id }, function (err, user) {
      // console.log("77");
      // console.log(user.id)
      return cb(err, user);
      // console.log("8");
    });
  }
));
// root directory homne
app.get("/", function(req, res){
  if (req.isAuthenticated()){
    res.redirect("/secrets")
  } else {
    res.render("home");
  }

});

// google auth route
app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);
//
app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });
// login route
app.get("/login", function(req, res){
  
  if (req.isAuthenticated()){
    res.redirect("/secrets")
  } else {
    res.render("login");
  }
});
// secrets route
app.get("/secrets", function(req, res){
  // console.log("9");
  if (req.isAuthenticated()){
    // console.log("10");
    res.render("secrets")
    // console.log("11")
    
  } else {
    res.redirect("/login");
  }
  
});

app.post("/login", function(req, res){
  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});



app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000.");
});
