'use strict';

class StatusForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  fetch(auth) {
    this.assignState({auth});
    axios.get('/statuses?auth=' + auth).then(response => this.assignState({statuses: response.data}));
  }

  assignState(state) {
    this.setState(_.assign({}, this.state, state));
  }

  render() {
    if (!this.state.statuses) {
      return 'Loading statuses...';
    }
    const options = _.map(this.state.statuses, (value, key) => <option key={key} value={key}>{value.label}</option>);
    const status = this.state.statuses[this.state.status];
    const description = status ? <p>{status.description}</p> : '';
    const actions = status ? status.actions.map(action => {
      const params = _.map(
        action.params,
        (value, key) => <li key={key}>{key}: {value}</li>
      );
      return (
        <li key={action.name}>
          <label>
            {action.name}
            <input name="action" value={action.name} type="checkbox" defaultChecked={true}/>
          </label>
          <ul>{params}</ul>
        </li>
      );
    }) : [];
    return (
      <form method="post" action="statuses">
        <p><a href='time.html'>Time</a></p>
        <label>
          Status:
          <select name="status" onChange={event => this.assignState({status: event.target.value})}>
            <option key="" value="">Select a status</option>
            {options}
          </select>
        </label>
        {description}
        <ul>{actions}</ul>
        <input type="hidden" name="auth" value={this.state.auth}/>
        <input type="submit" value="Submit"/>
      </form>
    );
  }
}

let statusForm;

ReactDOM.render(<StatusForm ref={(statusForm) => {
  window.statusForm = statusForm
}}/>, document.querySelector('#container'));

function onSignIn(googleUser) {
  const auth = JSON.stringify(googleUser.getAuthResponse());
  statusForm.fetch(auth);
}
