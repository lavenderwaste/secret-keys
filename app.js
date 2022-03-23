//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

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
    password: String
  });

  //passportLocalMongoose Active on userSchema
  userSchema.plugin(passportLocalMongoose);

  //USERDB Collection
  const User = new mongoose.model("User", userSchema);

  //Passport-Local-Mongoose Configuration
  passport.use(User.createStrategy());

  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

//ROUTES
app.get('/', (req, res) => {
  res.render('home');
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

app.post('/login', (req, res) => {

  //Check if username exist on DB
  User.findOne({username: req.body.username}, (err, foundUser) => {
    //if user exists, create object of user and store username and password
    if(foundUser) {
      const user = new User({
        username: req.body.username,
        password: req.body.password
      });

      //passport login authentication
    passport.authenticate("local", (err, user) => {
      if(err) {
        console.log(err);
      } else {
        if(user) {
          req.login(user, (err) => {
            res.redirect('/secrets');
          });
        } else {
          res.redirect('/login');
        }
      }
    })(req, res);
  } else {
    res.redirect('/login');
  }
 });
});

//SERVER LISTEN
app.listen(3000, ()=> {
  console.log('Server started on port 3000');
});
