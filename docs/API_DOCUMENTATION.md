# API Documentation

## Authentication Routes

### REST API (`/auth/`)

| Endpoint | Method | Description |
| --- | --- | --- |
| `/auth/register/` | `POST` | Registers a new user account. |
| `/auth/login/` | `POST` | Authenticates a user and returns a JWT. |

Both routes are backed by the same DRF view. The view determines whether to register or log a user in based on the URL pattern and can also accept an explicit `action` field (`"register"` or `"login"`) in the request body when needed.

#### Request Body

```json
{
  "username": "demo_user",
  "password": "example-pass"
}
```

#### Responses

- **Register** – `201 Created`

  ```json
  {
    "message": "User registered successfully",
    "id": 12
  }
  ```

- **Login** – `200 OK`

  ```json
  {
    "message": "User logged in",
    "token": "<jwt-token>"
  }
  ```

### Spotify OAuth (`/spotify/`)

#### `/login`

- **Method**: `GET`
- **Description**: Initiates the OAuth2 authorization process with Spotify by redirecting the user to the Spotify authorization page.
- **Query Parameters**: None
- **Response**: Redirects to the Spotify login and authorization page.

#### `/callback`

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
