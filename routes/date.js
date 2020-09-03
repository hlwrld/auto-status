const _ = require('lodash');
const moment = require('moment-timezone');
const icalendar = require('icalendar');

const express = require('express');
const router = express.Router();

const {google} = require('googleapis');

const env = process.env;

async function spreadsheet(spreadsheetId, range, auth) {
  const sheets = google.sheets({version: 'v4', auth});
  const response = await sheets.spreadsheets.values.get({spreadsheetId, range,});
  const [header, ...rows] = response.data.values;
  return rows.map(row => _.keyBy(row, value => header[_.indexOf(row, value)].toLowerCase()));
}

router.get('/', async (request, response) => {
  const authClient = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
  authClient.setCredentials({
    refresh_token: env.GOOGLE_REFRESH_TOKEN
  });
  const rows = await spreadsheet(
    env.GOOGLE_SPREADSHEET_ID_DATE,
    env.GOOGLE_SPREADSHEET_RANGE_DATE,
    authClient
  );
  const events = [];
  const oneDay = moment.duration(1, 'day').asSeconds();
  const durations = env.DURATIONS.split(',').map(duration => {
    const parts = duration.trim().split(/\s+/);
    const result = moment.duration();
    for (let i = 0; i < parts.length; i += 2) {
      result.add(parseInt(parts[i]), parts[i + 1]);
    }
    return result;
  });
  rows.forEach(row => {
    _.forOwn(row, (date, key) => {
      if (key !== 'name') {
        durations.forEach(duration => {
          const days = duration.asDays();
          const humanize = days === 0 ? '' : duration.humanize(true);
          const event = new icalendar.VEvent(`${row.name}-${key}-${days}`);
          event.setSummary(`${key} of ${row.name} expires ${humanize}`);
          const start = moment.tz(date, 'DD.MM.YYYY', true, env.TIME_ZONE).subtract(duration).toDate();
          event.setDate(start, oneDay);
          events.push(event);
        });
      }
    });
  });
  const ical = new icalendar.iCalendar();
  ical.addComponents(events);
  response.header('Content-Type', 'text/calender');
  response.send(ical.toString());
});

module.exports = router;
