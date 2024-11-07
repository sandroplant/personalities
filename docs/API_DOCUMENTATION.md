# API Documentation

## Authentication Routes

### 1. `/login`

- **Method**: `GET`
- **Description**: Initiates the OAuth2 authorization process with Spotify by redirecting the user to the Spotify authorization page.
- **Query Parameters**: None
- **Response**: Redirects to the Spotify login and authorization page.

### 2. `/callback`

- **Method**: `GET`
- **Description**: Handles the callback from Spotify after user authorization and exchanges the provided code for an access token.
- **Query Parameters**:
  - `code`: The authorization code provided by Spotify after successful login.
- **Response**: Redirects to `/profile` upon successful token exchange, or displays an error message in case of failure.

## Protected Routes

### 3. `/profile`

- **Method**: `GET`
- **Middleware**: `ensureAuthenticated` - Ensures the user is authenticated before accessing this route.
- **Description**: Retrieves the user's top artists, top tracks, and the currently playing song from Spotify.
- **Response**: A JSON object containing the user's top artists, top tracks, and currently playing song, structured as follows:
  ```json
  {
    "top_artists": [
      {
        "name": "Artist Name",
        "uri": "spotify:artist:<artist_id>",
        "genres": ["genre1", "genre2"]
      },
      ...
    ],
    "top_tracks": [
      {
        "name": "Track Name",
        "uri": "spotify:track:<track_id>",
        "album": "Album Name"
      },
      ...
    ],
    "currently_playing": {
      "name": "Track Name",
      "artist": "Artist Name(s)",
      "uri": "spotify:track:<track_id>",
      "album": "Album Name"
    }
  }
  ```
