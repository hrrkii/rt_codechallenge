import React, { Component } from 'react';
import './App.css';

import Calendar from './Calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Code Challenge Calendar</h1>
          <p>Click in a date's box to add appontment, click appointment to edit or delete it.</p>
        </header>
        <Calendar />
      </div>
    );
  }
}

export default App;
