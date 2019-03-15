const util = require('util');
const {google} = require('googleapis');

async function createEvent(calendarName, date, title, auth) {
  const calendar = google.calendar({version: 'v3', auth});
  const calendarId = await getCalendarId(calendarName, calendar);
  const event = await util.promisify(calendar.events.insert)({
    auth,
    calendarId,
    resource: {
      summary: title,
      start: {
        date: date.format('YYYY-MM-DD')
      },
      end: {
        date: date.format('YYYY-MM-DD')
      }
    },
  });
  console.log('Event created: %s', event.htmlLink);
}

async function getCalendarId(calendarName, calendar) {
  const response = await util.promisify(calendar.calendarList.list)({});
  return response.data.items.find(item => item.summary === calendarName).id;
}


class GoogleCalender {
  event({calendar, date, title, response}) {
    const authClient = response.locals.googleAuthClient;
    return createEvent(calendar, date, title, authClient);
  }
}

module.exports = new GoogleCalender();
