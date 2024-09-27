import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import crypto from 'crypto';
import fetch from 'node-fetch';
import {
  generateCodeVerifier,
  generateCodeChallenge
} from './spotifyAuthUtils.js';
import ensureAuthenticated from '../middleware/authMiddleware.js';

const router = express.Router();

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;
const scope =
  'user-read-private user-read-email user-top-read user-read-currently-playing';

let codeVerifier = '';
let codeChallenge = '';

// Start the authorization flow
router.get('/login', (req, res) => {
  codeVerifier = generateCodeVerifier();
  codeChallenge = generateCodeChallenge(codeVerifier);

  const state = crypto.randomBytes(16).toString('hex');

  res.redirect(
    'https://accounts.spotify.com/authorize?' +
      new URLSearchParams({
        response_type: 'code',
        client_id: client_id,
        redirect_uri: redirect_uri,
        scope: scope,
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      }).toString()
  );
});

// Handle callback and exchange code for access token
router.get('/callback', async (req, res) => {
  const { code } = req.query;

  console.log('Callback received with code:', code);

  if (!code) {
    console.log('No code provided');
    return res.redirect(
      '/#' + new URLSearchParams({ error: 'no_code' }).toString()
    );
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' +
          Buffer.from(`${client_id}:${client_secret}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri,
        code_verifier: codeVerifier
      })
    });

    const data = await response.json();

    console.log('Token response:', data);

    if (response.ok) {
      req.session.access_token = data.access_token;
      req.session.refresh_token = data.refresh_token;

      console.log('Access Token:', req.session.access_token);
      console.log('Refresh Token:', req.session.refresh_token);

      res.redirect('/profile'); // Redirect to the profile page after successful login
    } else {
      console.log('Error in token response:', data.error_description);
      res.redirect(
        '/#' + new URLSearchParams({ error: data.error_description }).toString()
      );
    }
  } catch (error) {
    console.error('Error during token exchange:', error);
    res.redirect(
      '/#' +
        new URLSearchParams({ error: 'failed_to_exchange_code' }).toString()
    );
  }
});

// Profile route to fetch and display user data
router.get('/profile', ensureAuthenticated, async (req, res) => {
  const accessToken = req.session.access_token;

  try {
    const topArtistsResponse = await fetch(
      'https://api.spotify.com/v1/me/top/artists?limit=10',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const topArtistsData = await topArtistsResponse.json();

    const topTracksResponse = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?limit=20',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const topTracksData = await topTracksResponse.json();

    const currentTrackResponse = await fetch(
      'https://api.spotify.com/v1/me/player/currently-playing',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const currentTrackData = await currentTrackResponse.json();

    const profileData = {
      top_artists: topArtistsData.items.map((artist) => ({
        name: artist.name,
        uri: artist.uri,
        genres: artist.genres // Adding genres to the response
      })),
      top_tracks: topTracksData.items.map((track) => ({
        name: track.name,
        uri: track.uri,
        album: track.album.name // Adding album to the response
      })),
      currently_playing: currentTrackData.item
        ? {
            name: currentTrackData.item.name,
            artist: currentTrackData.item.artists
              .map((artist) => artist.name)
              .join(', '),
            uri: currentTrackData.item.uri,
            album: currentTrackData.item.album.name // Adding album to the response
          }
        : null
    };

    res.json(profileData); // Send only the required fields
  } catch (err) {
    console.error('Error fetching profile data:', err);
    res.status(500).send('Failed to fetch profile data');
  }
});

export default router;
