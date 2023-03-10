const db = require('mongoose');
require('dotenv').config();

db.set('strictQuery', false);

db.connect(process.env.DB_NOTES_APP, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('connected to db'))
  .catch((err) => console.log(err));
