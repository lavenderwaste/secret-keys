//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

//Express-Session
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

//Passport Initialized
app.use(passport.initialize());
app.use(passport.session()); //passport use express-session

//DATABASE mongoose
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/userDB');
}

  //USERDB Schema
  const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String
  });

  //passportLocalMongoose Active on userSchema
  userSchema.plugin(passportLocalMongoose);
  //findOrCreate Plugin Active on userSchema
  userSchema.plugin(findOrCreate);

  //USERDB Collection
  const User = new mongoose.model("User", userSchema);

  //Passport-Local-Mongoose Configuration
  passport.use(User.createStrategy());

  passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
  });

  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

  //Google Auth 20 (Passport Google Auth20 Doc)
  passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
    },
    function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  ));

//ROUTES
app.get('/', (req, res) => {
  res.render('home');
});

  //passport Google Auth20 docs - Get Profile Information
  app.route('/auth/google').get(passport.authenticate('google', { scope: ['profile'] }));

  //passport Google Auth20 docs - Redirect to authorized page
  app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to authorized page.
    res.redirect('/secrets');
  });

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/secrets', (req, res) => {
  //erase cache for when logging out and avoid going back
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0');
  //before giving access, check if user has access
  if(req.isAuthenticated()) {
    res.render('secrets');
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.post('/register', (req, res) => {
  //passport-local-mongoose docs
  User.register({username: req.body.username}, req.body.password, (err, user) => {
    if(err) {
      console.log(err);
      res.redirect('/register');
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
});

app.post('/login', passport.authenticate('local', {failureRedirect: '/'}), (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, (err) => {
    if(err) {
      console.log(err);
    } else {
      res.redirect('/secrets');
    }
  });
});

//SERVER LISTEN
app.listen(3000, ()=> {
  console.log('Server started on port 3000');
});
