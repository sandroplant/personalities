import './styles.css';
document.addEventListener('DOMContentLoaded', () => {
    const appDiv = document.createElement('div');
    appDiv.innerHTML = '<h1>Hello from Webpack!</h1>';
    document.body.appendChild(appDiv);
});
