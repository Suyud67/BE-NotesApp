const { Schema, model } = require('mongoose');

const note = new Schema({
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    required: true,
  },
  created: {
    type: Date,
    required: true,
    default: Date.now(),
  },
});

const Note = model('notes', note);

module.exports = Note;
