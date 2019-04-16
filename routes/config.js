module.exports = {
  'statuses': {
    "sick-child": {
      "label": "Sick Child",
      "description": "At home with sick child",
      "actions": [
        {
          "name": "slack-status",
          "params": {
            "text": "Home with sick child",
            "emoji": ":face_with_thermometer:",
            "expire": "${today_end}"
          }
        },
        {
          "name": "slack-message",
          "params": {
            "text": "I'm at home with sick child, will not be working today. :face_with_thermometer:"
          }
        },
        {
          "name": "slack-reminder"
        },
        {
          "name": "google-calender-event",
          "params": {
            "title": `${process.env.USER_NAME} Sick Child`
          }
        },
        {
          "name": "status-hero-absence"
        }
      ]
    },
    "leave": {
      "label": "Leave",
      "description": "Leave",
      "actions": [
        {
          "name": "slack-status",
          "params": {
            "text": "Vacationing",
            "emoji": ":palm_tree:",
            "expire": "${today_end}"
          }
        },
        {
          "name": "slack-reminder"
        },
        {
          "name": "google-calender-event",
          "params": {
            "title": `${process.env.USER_NAME} Leave`
          }
        },
        {
          "name": "status-hero-absence"
        }
      ]
    },
    "sick": {
      "label": "Sick",
      "description": "Sick",
      "actions": [
        {
          "name": "slack-status",
          "params": {
            "text": "Out sick",
            "emoji": ":face_with_thermometer:",
            "expire": "${today_end}"
          }
        },
        {
          "name": "slack-message",
          "params": {
            "text": "I'm sick, will not be working today. :face_with_thermometer:"
          }
        },
        {
          "name": "slack-reminder"
        },
        {
          "name": "google-calender-event",
          "params": {
            "title": `${process.env.USER_NAME} Sick`
          }
        },
        {
          "name": "status-hero-absence"
        }
      ]
    }
  },
  "actions": {
    "slack-status": {
      "service": "slack",
      "action": "status"
    },
    "slack-message": {
      "service": "slack",
      "action": "message",
      "params": {
        "channels": process.env.SLACK_CHANNELS.split(',')
      }
    },
    "slack-reminder": {
      "service": "slack",
      "action": "reminder",
      "params": {
        "text": `Register leave in ${process.env.LEAVE_REGISTER_URI} for \${today_date}.`,
        "time": "tomorrow"
      }
    },
    "google-calender-event": {
      "service": "google-calender",
      "action": "event",
      "params": {
        "date": "${today}",
        "calendar": process.env.GOOGLE_CALENDER_NAME
      }
    },
    "status-hero-absence": {
      "service": "status-hero",
      "action": "absence",
      "params": {
        "date": "${today}"
      }
    }
  }
};
