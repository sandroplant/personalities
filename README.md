# Personalities

Personalities is a web application that allows users to explore and interact with various personality-related features, including Spotify integration, messaging, and AI-driven responses.

## Table of Contents

- [Features](#features)
  - [Current Features](#current-features)
  - [Future Features](#future-features)
- [Installation](#installation)
- [Usage](#usage)
- [Docker](#docker)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

## Features

### Current Features

1. **User Authentication and Profile Management**

   - Secure user authentication and profile management.
   - Create and customize profiles with photo, cover, bio, personal information, hobbies, interests, and physical traits.
   - Granular privacy controls for each field (public, friends only, or private).
   - View content the user has liked and follow other users’ customized newsfeeds.

2. **Evaluations by Friends in Different Criteria**

   - Friends can rate users on various characteristics (e.g., humor, intellect, open‑mindedness).
   - Users can choose criteria from a list or suggest new ones.
   - Ratings are on a 1–10 scale, aggregated anonymously.
   - Users control the visibility of their evaluations (public, friends only, private) and whether to display individual scores.

### Future Features

1. **Content Posting and Creation**
   - Users can post videos, photos, and written content.
   - Each post can be rated based on criteria chosen by the content creator.
   - Option to hide ratings, likes, and comments.
   - AI feedback before posting: suggestions on improvements, optimal posting times, hashtags, and criteria selection.
   - Stories and temporary content.
   - Anonymous commenting, configurable by the content creator.
   - Privacy controls for viewing, rating, and commenting.

2. **User‑Defined Content Rating Criteria**
   - Influencers choose which criteria their content should be rated on.
   - Separate from personal trait evaluations.
   - Includes insights into audience engagement and tools for personal brand growth.

3. **AI Content Analysis & Optimization Tools**
   - AI analyzes content for quality and engagement potential.
   - Suggests improvements, posting times, and hashtags.
   - Predicts potential virality based on trends.
   - Provides educational resources for content creation.

4. **Charity Coefficient**
   - Track donations, volunteer hours, and other charitable actions.
   - Display an optional Charity Coefficient on profiles.
   - Earn badges and recognition for contributions.
   - Leaderboards and community challenges.
   - Integrate with payment platforms for easy donations.
   - Privacy controls for contributions.
   - Partner with verified charities and show impact reports.

5. **Charity Page**
   - Discover charities and causes.
   - Donate securely through the platform.
   - Sign up for charity events or volunteer opportunities.
   - View community impact statistics.

6. **Newsfeed of Videos**
   - Personalized video feed based on user interests and customized criteria levels.
   - Users can like, comment on, and repost videos.
   - Stories functionality similar to other social apps.
   - Filters to view content that matches specific criteria thresholds (e.g., humor above 9).

7. **Map Radius Feature**
   - Find and connect with users nearby based on selected characteristics.
   - Visual map representation with privacy options for location sharing.

8. **Enhanced User Settings**
   - Expanded privacy controls and notification preferences.
   - Account management (security settings, two‑factor authentication).
   - Customization options for themes and interface layout.

9. **Mobile App Development**
   - Native iOS and Android apps.
   - Optimized interfaces for mobile devices.
   - Push notifications, offline mode, and device integration (camera, GPS, sensors).

10. **Integration with Additional APIs**
    - Connect with other social platforms (e.g., Twitter, Instagram, Facebook), subject to policy.
    - Cross‑posting capabilities.
    - Integration with services like YouTube for video and Goodreads for books.

11. **Premium Features**
    - Advanced analytics and insights.
    - Access to enhanced AI capabilities.
    - Additional customization options.
    - Ad‑free experience.
    - Subscription model.

12. **Testing and Quality Assurance**
    - Automated and manual testing frameworks.
    - Continuous performance monitoring.
    - User feedback loops to inform improvements.

13. **Spotify Integration**
    - Display top artists, top songs, and currently playing tracks.
    - Real‑time playback updates.
    - Privacy controls for what is shared.

14. **Personality Evaluations (by AI)**
    - Users select traits to be evaluated (e.g., humor, intellect).
    - AI aggregates public social data (with user consent) to rate users on a 1–10 scale.
    - Full compliance with GDPR, CCPA, and other privacy regulations.
    - Anonymous results with customizable visibility.

15. **Interactive AI Evaluations and Personal AI Advocates**
    - AI explains how evaluations are determined and provides examples.
    - Users can challenge or clarify evaluations.
    - AI learns from user feedback and refines its understanding over time.

16. **Search Engine**
    - Search for users by traits, interests, location, Spotify data, and more.
    - Filter results by specific criteria thresholds.
    - Real‑time search for users listening to particular songs or artists.

17. **Messenger with AI Integration**
    - Real‑time chat between users.
    - Optional AI participation in conversations (with consent from all participants).
    - Mystery messages triggering audio/video reactions when opened.
    - Anonymous commenting in messages when allowed by the content creator.

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/personalities.git
   cd personalities
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:

   Create a `.env` file in the root directory and add the following variables:

   ```env
   PORT=80
   MONGO_URI=your_mongodb_uri
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=your_spotify_redirect_uri
   SESSION_SECRET=your_session_secret
   OPENAI_API_KEY=your_openai_api_key
   CLIENT_URL=http://localhost:3000
   NODE_ENV=development
   ```

## Usage

1. **Start the server**:

   ```bash
   npm start
   ```

2. **Start the development server**:

   ```bash
   npm run dev
   ```

3. **Run tests**:

   ```bash
   npm test
   ```

## Docker

1. **Build the Docker image**:

   ```bash
   docker build -t my-express-app-server .
   ```

2. **Run the Docker container**:

   ```bash
   docker run -p 80:80 my-express-app-server
   ```

## Environment Variables

- `PORT`: The port on which the server will run.
- `MONGO_URI`: The URI for connecting to MongoDB.
- `SPOTIFY_CLIENT_ID`: Your Spotify client ID.
- `SPOTIFY_CLIENT_SECRET`: Your Spotify client secret.
- `SPOTIFY_REDIRECT_URI`: Your Spotify redirect URI.
- `SESSION_SECRET`: Secret key for session management.
- `OPENAI_API_KEY`: Your OpenAI API key.
- `CLIENT_URL`: The URL of the client application.
- `NODE_ENV`: The environment in which the application is running (development, production, etc.).

## Scripts

- `npm start`: Start the application.
- `npm run dev`: Start the application in development mode with `nodemon`.
- `npm test`: Run tests.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Open a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
