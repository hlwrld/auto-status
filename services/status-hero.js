const util = require('util');
const request = require('request');
const post = util.promisify(request.post);

const teamId = process.env.STATUS_HERO_TEAM_ID;
const apiKey = process.env.STATUS_HERO_API_KEY;
const uri = process.env.STATUS_HERO_ABSENCES_URI;

class StatusHero {
  absence({date}) {
    return post({
      uri,
      headers: {
        'X-TEAM-ID': teamId,
        'X-API-KEY': apiKey
      },
      body: {date: date.format('YYYY-MM-DD')},
      json: true
    });
  }
}

module.exports = new StatusHero();
