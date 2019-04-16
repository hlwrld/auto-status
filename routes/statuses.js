const _ = require('lodash');
const moment = require('moment');
const express = require('express');
const router = express.Router();
const config = require('./config');
const auth = require('./auth');
const services = require('require-dir')('../services');

const dates = {
  today: () => moment().startOf('day'),
  today_end: () => moment().endOf('day')
};

const replaceDates = (value, format) => {
  if (_.isArray(value)) {
    return _.map(value, v => replaceDates(v, format));
  }
  if (_.isString(value)) {
    if (!format) {
      const match = /^\${(\w+)}$/.exec(value);
      if (match) {
        return dates[match[1]]();
      }
    }
    return value.replace(
      /\${(\w+)}/g,
      (match, p1) => dates[p1]().format()
    );
  }
  return value;
};

const statuses = _.cloneDeep(config.statuses);
_.forEach(
  statuses,
  status => {
    _.forEach(
      status.actions,
      action => {
        action.params
          = _(config.actions[action.name].params)
          .assign(action.params)
          .pickBy(value => !!value)
          .mapValues(value => replaceDates(value, true))
          .value();
      }
    )
  }
);

router.get('/', auth.isAuthorized, function (request, response) {
  response.send(statuses);
});

router.post('/', auth.isAuthorized, function (request, response, next) {
  const body = request.body;
  let actionNames = body.action;
  if (_.isString(actionNames)) {
    actionNames = [actionNames];
  }
  Promise.all(
    _.map(actionNames, actionName => {
      const action = _.cloneDeep(config.actions[actionName]);
      const params
        = _(action.params)
        .assign(
          config
            .statuses[body.status]
            .actions
            .find(action => action.name === actionName)
            .params
        )
        .assign({request, response})
        .pickBy(value => !!value)
        .mapValues(value => replaceDates(value, false))
        .value();
      return services[action.service][action.action](params);
    })
  )
    .then(() => response.redirect('/'))
    .catch(error => {
      console.error(error);
      next(error);
    });
});

module.exports = router;
