import './styles.css';
// Use DOMContentLoaded to ensure the DOM is fully loaded before manipulating it
document.addEventListener('DOMContentLoaded', () => {
    const appDiv = document.createElement('div');
    appDiv.innerHTML = '<h1>Hello from Webpack!</h1>';
    document.body.appendChild(appDiv);
});
