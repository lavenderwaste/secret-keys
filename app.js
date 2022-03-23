//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const bodyParser = require('body-parser');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

//DATABASE mongoose
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/userDB');
}

  //USERDB Protected
  const userSchema = new mongoose.Schema ({
    email: String,
    password: String
  });

  //Encrypt-Plugin
  userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

  const User = new mongoose.model("User", userSchema);

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

app.post('/register', (req, res) => {
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });

  newUser.save( (err) => {
    if(err) {
      console.log(err);
    } else {
      res.render('secrets');
    }
  });
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email: username}, (err, foundUser) => {
    if(err) {
      console.log(err);
    } else {
      if (foundUser) {
        if (foundUser.password === password) {
          res.render('secrets');
        }
      }
    }
  });
});

//SERVER LISTEN
app.listen(3000, ()=> {
  console.log('Server started on port 3000');
});
