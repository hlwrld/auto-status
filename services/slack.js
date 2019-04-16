const slack = require('slack');

const token = process.env.SLACK_TOKEN;

class SlackService {

  status({text, emoji, expire}) {
    return slack.users.profile.set({
      token,
      profile: {
        status_text: text,
        status_emoji: emoji,
        status_expiration: expire.unix()
      }
    });
  }

  message({channels, text}) {
    return Promise.all(channels.map(channel =>
      slack.chat.postMessage({
        token,
        channel,
        text,
        as_user: true
      })
    ));
  }

  reminder({text, time}) {
    return slack.reminders.add({
      token,
      text,
      time
    });
  }
}

module.exports = new SlackService();
