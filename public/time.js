'use strict';

class TimeForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {date: moment().format('YYYY-MM-DD')};
  }

  async fetch(auth) {
    await this.assignState({auth});
    const date = this.state.date;
    const response = await axios.get(`/time/${date}?auth=${auth}`);
    await this.assignState({time: response.data})
  }

  assignState(state) {
    return new Promise(resolve => {
      this.setState(_.assign({}, this.state, state), resolve);
    });
  }

  render() {
    if (!this.state.time) {
      return 'Loading time...';
    }
    const times = this.state.time.map((value, index) => {
      const details = value.details;
      const time = value.time;
      return (
        <tr key={index}>
          <td>{details}</td>
          <td>{time}</td>
          <td>
            <input type="text" name={'issue'+index}/>
          </td>
          <td>
            <input type="text" name={'time'+index}/>
          </td>
        </tr>
      );
    });
    return (
      <form method="post" action="time">
        <label>
          Date:
          <input
            type="date"
            name="date"
            value={this.state.date}
            onChange={async event =>  {
              const date = event.target.value;
              await this.assignState({date});
              await this.fetch(this.state.auth);
            }}
          />
        </label>
        <table border="1">
          <thead>
          <tr>
            <td>Details</td>
            <td>Time</td>
            <td>Issue</td>
            <td>Time</td>
          </tr>
          </thead>
          <tbody>{times}</tbody>
        </table>
        <input type="hidden" name="auth" value={this.state.auth}/>
        <input type="submit" value="Submit"/>
      </form>
    );
  }
}

let timeForm;

ReactDOM.render(<TimeForm ref={(timeForm) => {
  window.timeForm = timeForm;
}}/>, document.querySelector('#container'));

function onSignIn(googleUser) {
  const auth = JSON.stringify(googleUser.getAuthResponse());
  timeForm.fetch(auth);
}
