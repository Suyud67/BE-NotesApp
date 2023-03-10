const { Schema, model } = require('mongoose');

const user = new Schema({
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  created: {
    type: String,
    default: Date.now(),
  },
});

const User = model('users', user);

module.exports = User;
