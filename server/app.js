const express = require('express');
const mustacheExpress = require('mustache-express');
const path = require('path');
const logger = require('morgan');

const app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, '../public')));

app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', path.resolve(__dirname, '../views'));

app.get('/', function (request, response) {
  response.render(
    'index',
    {
      google_scope: process.env.GOOGLE_SCOPE,
      google_client_id: process.env.GOOGLE_CLIENT_ID
    }
  );
});

const statusesRouter = require('../routes/statuses');
app.use('/statuses', statusesRouter);

const timeRouter = require('../routes/time');
app.use('/time', timeRouter);

module.exports = app;
