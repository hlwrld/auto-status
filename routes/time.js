const _ = require('lodash');
const moment = require('moment');

const express = require('express');
const router = express.Router();

const util = require('util');
const request = require('request');
const get = util.promisify(request.get);
const post = util.promisify(request.post);

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

const jiraSummaries = new Map();

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
  const rowPromises = remoteData.rows
    .map(row => _.mapKeys(row, (value, index) => keyMap[remoteData.row_headers[index]]))
    .map(row => ({
      date: row.date,
      time: row.time,
      details: `${row.activity}-${row.document}-${row.category}`
    }))
    .map(
      row =>
        jiraDetails(row.details)
          .then(details => ({...row, details}))
    );
  const rows = await Promise.all(rowPromises);
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

router.post('/', auth.isAuthorized, async (request, response) => {
  const body = request.body;
  const date = body.date;
  _.forEach(body, (value, key) => {
    if (value && key.startsWith('issue')) {
      const issueKey = value;
      const index = key.substring('issue'.length);
      const time = body[`time${index}`];
      logTime(date, issueKey, time).catch(console.error);
    }
  });
  response.redirect('/time.html');
});

async function jiraDetails(details) {
  const result = /[A-Z]{2,}-\d+/.exec(details);
  if (!result) {
    return details;
  }
  const jiraIssueKey = result[0];
  const jiraIssueURI = `${env.JIRA_URI}browse/${jiraIssueKey}`;
  let summary = jiraSummaries.get(jiraIssueKey);
  if (!summary) {
    const jiraIssueAPIURI = `${env.JIRA_URI}rest/agile/1.0/issue/${jiraIssueKey}`;
    const response = await get({
      url: jiraIssueAPIURI,
      auth: {
        user: env.JIRA_USER,
        pass: env.JIRA_PASSWORD,
      }
    });
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      summary = data.fields ? data.fields.summary : '<no summary>';
    }
    else {
      console.error(`${jiraIssueAPIURI} returned ${response.statusCode}`);
      console.error(response.body);
      summary = '<no summary>';
    }
    jiraSummaries.set(jiraIssueKey, summary);
  }
  return `${jiraIssueURI} ${summary}`;
}

async function logTime(date, issueKey, time) {
  const jiraIssueAPIURI = `${env.JIRA_URI}rest/api/2/issue/${issueKey}/worklog`;
  const response = await post({
    url: jiraIssueAPIURI,
    auth: {
      user: env.JIRA_USER,
      pass: env.JIRA_PASSWORD,
    },
    body: {
      started: moment(date).format('YYYY-MM-DDThh:mm:ss.SSSZZ'),
      timeSpent: time
    },
    json: true
  });
  if (response.statusCode !== 201) {
    console.error(`${jiraIssueAPIURI} returned ${response.statusCode}`);
    console.error(response.body);
  }
}

function humanize(seconds) {
  return moment.duration(seconds, 'seconds').humanize();
}

module.exports = router;
