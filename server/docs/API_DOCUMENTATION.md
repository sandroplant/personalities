# API Documentation

## Authentication Routes

### 1. `/login`
- **Method**: `GET`
- **Description**: Redirects the user to the Spotify authorization page.
- **Query Parameters**: None
- **Response**: Redirect to Spotify for login and authorization.

### 2. `/callback`
- **Method**: `GET`
- **Description**: Handles the callback from Spotify after user authorization and exchanges the code for an access token.
- **Query Parameters**:
  - `code`: Authorization code provided by Spotify.
- **Response**: Redirect to `/profile` on success or error message on failure.

## Protected Routes

### 3. `/profile`
- **Method**: `GET`
- **Middleware**: `ensureAuthenticated`
- **Description**: Fetches the user’s top artists, top tracks, and currently playing song from Spotify.
- **Response**: JSON object with the following structure:
  ```json
  {
    "top_artists": [
      {
        "name": "Artist Name",
        "uri": "spotify:artist:...",
        "genres": ["genre1", "genre2"]
      },
      ...
    ],
    "top_tracks": [
      {
        "name": "Track Name",
        "uri": "spotify:track:...",
        "album": "Album Name"
      },
      ...
    ],
    "currently_playing": {
      "name": "Track Name",
      "artist": "Artist1, Artist2",
      "uri": "spotify:track:...",
      "album": "Album Name"
    }
  }
