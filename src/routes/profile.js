const express = require('express');
const router = express.Router();
const SpotifyWebApi = require('spotify-web-api-node');
const User = require('../models/User');

router.get('/', async (req, res) => {
  if (!req.session.access_token) {
    return res.redirect('/auth/login');
  }

  const spotifyApi = new SpotifyWebApi();
  spotifyApi.setAccessToken(req.session.access_token);

  try {
    const [userData, topArtistsData, topTracksData, currentlyPlayingData] = await Promise.all([
      spotifyApi.getMe(),
      spotifyApi.getMyTopArtists(),
      spotifyApi.getMyTopTracks(),
      spotifyApi.getMyCurrentPlayingTrack()
    ]);

    const profileData = {
      spotifyId: userData.body.id,
      displayName: userData.body.display_name,
      email: userData.body.email,
      images: userData.body.images,
      topArtists: topArtistsData.body.items,
      topTracks: topTracksData.body.items,
      currentlyPlaying: currentlyPlayingData.body.item,
    };

    let user = await User.findOne({ spotifyId: profileData.spotifyId });

    if (!user) {
      user = new User(profileData);
    } else {
      user.displayName = profileData.displayName;
      user.email = profileData.email;
      user.images = profileData.images;
      user.topArtists = profileData.topArtists;
      user.topTracks = profileData.topTracks;
      user.currentlyPlaying = profileData.currentlyPlaying;
    }

    await user.save();
    res.json(user); // Return the updated user profile
  } catch (error) {
    console.error('Failed to fetch or save profile data:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
