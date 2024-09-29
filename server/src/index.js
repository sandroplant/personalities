// src/index.js

import './styles.css';

console.log('Webpack is working!');

const appDiv = document.createElement('div');
appDiv.innerHTML = '<h1>Hello from Webpack!</h1>';
document.body.appendChild(appDiv);
