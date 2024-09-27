import React from 'react';
import Messenger from './components/Messenger.js'; // Import the Messenger component with .js extension
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <h1>Messenger with AI</h1>
        {/* Include the Messenger component and pass the userId as a prop */}
        <Messenger userId="yourUserIdHere" />
      </header>
    </div>
  );
}

export default App;
