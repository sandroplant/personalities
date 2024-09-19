const express = require('express');
const router = express.Router();
const SpotifyWebApi = require('spotify-web-api-node');

// Initialize Spotify Web API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Middleware to set access token (retrieve this from session or database)
router.use(async (req, res, next) => {
  const accessToken = req.session.access_token; // Replace with your method of retrieving the access token

  if (accessToken) {
    spotifyApi.setAccessToken(accessToken);
    next();
  } else {
    res.redirect('/auth/login');
  }
});

// Route to get user profile
router.get('/profile', async (req, res) => {
  try {
    const userData = await spotifyApi.getMe();
    const topTracks = await spotifyApi.getMyTopTracks();
    const topArtists = await spotifyApi.getMyTopArtists();

    res.json({
      user: userData.body,
      topTracks: topTracks.body.items,
      topArtists: topArtists.body.items
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
