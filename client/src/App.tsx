// client/src/App.tsx

import React from 'react';
import Messenger from './components/Messenger';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
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
        {/* Ensure that the Messenger component exists in src/components/Messenger.tsx */}
        <Messenger userId="yourUserIdHere" />
      </header>
    </div>
  );
};

export default App;
