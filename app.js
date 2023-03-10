const express = require('express');
const routes = require('./routes/routes');
require('./db/db');

const app = express();
const port = 5000;

app.use(routes);

app.listen(port, () => console.log(`App running at port ${port}!`));
