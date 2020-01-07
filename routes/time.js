const _ = require('lodash');
const moment = require('moment');

const express = require('express');
const router = express.Router();

const util = require('util');
const request = require('request');
const get = util.promisify(request.get);

const auth = require('./auth');

const env = process.env;

const keyMap = {
  'Date': 'date',
  'Time Spent (seconds)': 'time',
  'Activity': 'activity',
  'Document': 'document',
  'Category': 'category'
};
const timeLimit = moment.duration(5, 'minutes').asSeconds();

router.get('/(:date)?', auth.isAuthorized, async (request, response) => {
  const params = request.params;
  if (!params.date) {
    const now = moment();
    return response.redirect(`/time/${now.format('YYYY-MM-DD')}?auth=${request.query.auth}`);
  }
  const date = moment(params.date, 'YYYY-MM-DD', true);
  if (!date.isValid()) {
    return response.sendStatus(404);
  }
  const remoteResponse = await get({
    url: env.TIME_API_URI,
    qs: {
      key: env.TIME_API_KEY,
      perspective: 'interval',
      restrict_kind: 'document',
      restrict_begin: date.format('YYYY-MM-DD'),
      restrict_end: date.format('YYYY-MM-DD'),
      interval: 'hour',
      format: 'json'
    }
  });

  const remoteData = JSON.parse(remoteResponse.body);
  const rows = remoteData.rows
    .map(row => _.mapKeys(row, (value, index) => keyMap[remoteData.row_headers[index]]))
    .map(row => ({
      date: row.date,
      time: row.time,
      details: `${row.activity}-${row.document}-${row.category}`
    }))
    .map(row => ({...row, details: issueURI(row.details) || row.details}));
  const groupedRows
    = _(rows)
    .groupBy('details')
    .mapValues(values => values.reduce((acc, value) => acc + value.time, 0))
    .toPairs()
    .map(pair => ({details: pair[0], time: pair[1]}))
    .values();
  const filteredRows
    = groupedRows
    .filter(row => row.time >= timeLimit)
    .sort((a, b) => b.time - a.time)
    .map(row => ({...row, time: humanize(row.time)}));
  response.send(filteredRows);
});

function issueURI(details) {
  const result = /[A-Z]{2,}-\d+/.exec(details);
  return result ? env.ISSUE_PREFIX + result[0] : undefined;
}

function humanize(seconds) {
  return moment.duration(seconds, 'seconds').humanize();
}

module.exports = router;
