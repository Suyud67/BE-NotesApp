const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/users');
const Notes = require('../model/notes');
const cors = require('cors');
const Joi = require('joi');
require('dotenv').config();

// config salt for bcrypt
const routes = express();
const saltRounds = 10;

// config CORS and return every request into JSON
routes.use(cors());
routes.use(express.json());

// register routes
routes.post('/register', async (req, res) => {
  const { email, name, password } = req.body;

  // check input user with data in db
  const user = await User.findOne({ email });

  // make Joi schema
  const registerSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email({ tlds: { allow: ['com', 'net'] } }),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
  });

  const { error, value } = registerSchema.validate({
    name,
    email,
    password,
  });

  // make validation for user input
  if (error) {
    return res.status(400).json({
      error: true,
      statusCode: '400',
      message: error.details[0].message,
    });
  }

  // if email is already exist return error
  if (user) {
    return res.status(400).json({
      error: true,
      statusCode: '400',
      message: 'Sorry, user with this email already exist!',
    });
  }

  // hash user password
  const hashedPass = await bcrypt.hash(password, saltRounds);

  // save user data to document
  const newUser = new User({
    email,
    name,
    password: hashedPass,
  });

  // save user data to db
  newUser.save((err) => {
    if (err) {
      return res.status(400).json({
        error: true,
        statusCode: '400',
        message: err,
      });
    }

    res.status(201).json({
      error: false,
      statusCode: '201',
      message: 'New user successfully created!',
    });
  });
});

// login routes
routes.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // make Joi schema
  const loginSchema = Joi.object({
    email: Joi.string().email({ tlds: { allow: ['com', 'net'] } }),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
  });

  const { error, value } = loginSchema.validate({
    email,
    password,
  });

  // make validation for user input
  if (error) {
    return res.status(400).json({
      error: true,
      statusCode: '400',
      message: error.details[0].message,
    });
  }

  // find user by email
  const user = await User.findOne({ email });

  bcrypt.compare(password, user.password, (err, result) => {
    // if password and user password (from db) is not same
    if (result === false) {
      return res.status(400).json({
        error: true,
        statusCode: '400',
        message: 'invalid Password or Email',
      });
    }

    // make payload for restoring in jwt
    const payload = {
      id: user._id,
      userActive: user.name,
      email: user.email,
    };

    // make json web token with payload
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1h', algorithm: 'HS256' });

    res.status(200).json({
      error: false,
      statusCode: '200',
      message: 'Login successfully!',
      data: {
        accessToken: token,
      },
    });
  });
});

// verify jwt token for using notes app
routes.use((req, res, next) => {
  const header = req.headers['authorization'];

  if (typeof header !== 'undefined') {
    const bearer = header.split(' ');
    const bearerToken = bearer[1];

    // check jw token and send it to another routes
    jwt.verify(bearerToken, process.env.JWT_SECRET_KEY, (err, result) => {
      if (err) {
        return res.status(400).json({
          error: true,
          statusCode: '400',
          message: err,
        });
      }

      req.data = result;
      next();
    });
  } else {
    res.status(401).json({
      error: true,
      statusCode: '401',
      message: 'Unauthorized',
      data: null,
    });
  }
});

// get user active
routes.get('/users/me', (req, res) => {
  const { id, userActive, email } = req.data;

  if (!req.data) {
    return res.status(400).json({
      error: true,
      statusCode: '400',
      message: 'Bad Request',
    });
  }

  res.status(200).json({
    error: false,
    statusCode: '200',
    data: {
      id,
      userActive,
      email,
    },
  });
});

// get all notes by email user active
routes.get('/notes', async (req, res) => {
  const getUserActive = req.data;
  const getNotes = await Notes.find({ owner: getUserActive.email });

  res.status(200).json({
    error: false,
    statusCode: '200',
    data: {
      notes: getNotes,
    },
  });
});

// add note
routes.post('/notes/add', async (req, res) => {
  const { title, body } = req.body;

  // get owner notes using jwt
  const { email } = req.data;

  const newNote = new Notes({
    title,
    body,
    owner: email,
    created: new Date().toISOString(),
  });

  newNote.save((err) => {
    if (err) {
      return res.status(400).json({
        error: true,
        statusCode: '400',
        message: err,
      });
    }

    res.status(201).json({
      error: false,
      statusCode: '201',
      message: 'New note success to created!',
    });
  });
});

// delete note
routes.get('/notes/delete/:id', async (req, res) => {
  const userNote = req.params.id;
  const notes = await Notes.deleteOne({ _id: userNote });

  if (notes.deletedCount === 0) {
    return res.status(400).json({
      error: true,
      statusCode: '400',
      message: 'Sorry, note already deleted',
    });
  }
  res.status(200).json({
    error: false,
    statusCode: '200',
    message: 'Delete note successfully!',
  });
});

// get detail note
routes.get('/notes/:id', async (req, res) => {
  const note = await Notes.findOne({ _id: req.params.id });

  if (!note) {
    return res.status(400).json({
      error: true,
      statusCode: '400',
      message: 'Sorry, invalid ID note',
    });
  }

  res.status(200).json({
    error: false,
    statusCode: '200',
    data: {
      note,
    },
  });
});

module.exports = routes;
