// spotify.js
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: 'd3a71e2136a34037ab54bbf5b278f96c',
  clientSecret: 'e41d3e11098c4f15b98f6f9b5e0cf9bb',
  redirectUri: 'http://localhost:5001/callback'
});

module.exports = spotifyApi;
