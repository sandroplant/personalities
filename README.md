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

1. **User Profiles**

   - **Description**: Users can create and customize their profiles with personal information and preferences.
   - **Key Features**:
     - **Profile Customization**:
       - Users can upload only one profile photo and one cover photo.
       - Comprehensive bio and personal information sections.
       - Information like bio, hobbies, interests, favorite movies, personal information like birthday, etc., should be (if possible) retrieved from different social apps like Facebook, Instagram, and so on.
       - Include physical attributes (height, body type, hair color, eye color, etc.).
       - Moral values, psychological traits, artistic skills, hobbies, and interests.
       - All information provided can be used in the search engine, allowing users to find others based on these attributes.
     - **Privacy Settings**:
       - Users have control over who can view personal information and evaluations.
       - Users have control over whether to accept requests from other users to show any specific characteristics they have evaluated or not.
       - Options to make certain aspects of the profile public, visible to friends only, or private.
       - Ability to show or hide specific characteristic evaluations (public, friends, or private).
     - **Content Display**:
       - Users can view content they have liked.
       - Separate sections for content the user has liked.
     - **Follow User's Newsfeed**:
       - A button on the user's profile allows others to start viewing that user's feed, which has already been customized by the user.

2. **Spotify Integration**

   - **Description**: Integrate Spotify to display users' listening habits and musical preferences.
   - **Key Features**:
     - **Music Sharing**:
       - Display top artists, top songs, and current playback status on user profiles.
       - Users can choose to share their playlists with friends or the public.
     - **Privacy and Consent**:
       - Users explicitly agree to share their Spotify data.
       - Users can choose which aspects of their Spotify data are displayed.
     - **Exclusions**:
       - No music recommendations based on listening history.
       - No integration of Spotify's recommendation engine.
       - No collaborative playlists or group listening sessions.

3. **Personality Evaluations**

   - **Description**: AI evaluates users on selected characteristics based on their content and aggregated data from various social media platforms.
   - **Key Features**:
     - **Characteristics Selection**:
       - Users choose which characteristics they want to be evaluated on (e.g., humor, open-mindedness, intellect, and many more).
       - There is a list of many different criteria to choose from, but users can also request to have the specific criterion they want to be evaluated.
     - **AI Aggregation and Analysis**:
       - With user consent, AI aggregates data from users' various social media platforms.
       - Secure connection to other social media accounts through APIs.
       - Aggregation of publicly accessible data (posts, comments, likes, interactions).
       - No access to private messages.
       - AI evaluates aggregated data to provide insights across different characteristics.
       - Identification of patterns and trends in user behavior.
     - **Evaluations Display**:
       - Evaluations are numerical ratings from 1 to 10.
       - All ratings are anonymous.
       - Evaluations are displayed on user profiles in a visually appealing manner.
       - Users can choose to show or hide their evaluations (public, friends only, or private).
     - **Privacy and Ethical Considerations**:
       - **User Control and Consent**:
         - Users explicitly agree to what data is accessed and how it is used.
         - Options to select which data is included in the analysis.
       - **Compliance with Laws**:
         - Adherence to GDPR, CCPA, and other relevant privacy regulations.
       - **Data Security**:
         - Encryption and secure storage of user data.
         - Regular audits and security assessments.
       - **Transparency**:
         - Clear communication about how data is used and processed.
         - Easy-to-understand privacy policies.
     - **Influencers and Celebrities Evaluations**:
       - Users evaluate Influencers and Celebrities in the characteristics they choose to evaluate them in. In this case, Influencers or Celebrities do not have to have accounts in our app/website.
       - Celebrities’ and Influencers’ names get registered by our app itself or upon the request of users and made possible to be rated in the criteria users choose.

4. **Interactive AI Evaluations and Personal AI Advocates**

   - **Description**: Users can interact with their personal AI agent (or directly the General AI evaluating the users’ characteristics) to discuss and understand their evaluations and potentially influence them by making sense, providing logical points that AI might have missed or overlooked.
   - **Key Features**:
     - **Conversational Interface**:
       - Chatbot or virtual assistant for real-time conversations.
       - Natural language understanding for intuitive interactions.
     - **Evaluation Explanations**:
       - AI provides reasoning behind its evaluations based on analyzed data.
       - Examples and references to specific content or behaviors.
     - **User Feedback and Advocacy**:
       - Users can question the evaluations.
       - The AI advocate works with the user to understand their reasons for certain behaviors.
       - If users provide valid points that broaden the AI's understanding, the AI may adjust the evaluations accordingly.
       - The AI advocate presents the user's case to the main evaluation AI, ensuring fair evaluations by providing context and explanations.
     - **Personalization and Continuous Learning**:
       - The AI agent learns from user interactions, preferences, and behaviors.
       - Tailors its approach and communication style to the user.
       - Updates its understanding as the user evolves and grows.
       - Helps the user navigate and utilize the platform effectively.

5. **Friend Suggestions**

   - **Description**: Suggest potential friends or connections based on customized criteria and compatibility.
   - **Key Features**:
     - **Customization**:
       - Users can specify the criteria for friend suggestions, including desired (minimum, maximum, or in-between) levels of characteristics.
     - **Compatibility Scores**:
       - The system calculates how well suggested users match the desired criteria (e.g., "This user satisfies 70% of your desired criteria").
     - **Matching and Suggestions**:
       - Users receive matches based on their customized preferences.
       - Suggestions are primarily based on the user's customized levels of different characteristics.

6. **Search Engine**

   - **Description**: A powerful search tool to find users based on evaluated characteristics, personality types, personal attributes, interests, and Spotify data and LOCATION.
   - **Key Features**:
     - **Advanced Filtering**:
       - Search by specific criteria such as characteristics, interests, location, and more.
       - Ability to customize searches using levels of different characteristics (e.g., humor above 9, intellect below 2).
     - **Spotify Integration**:
       - Users can be found according to the artists and songs they listen to.
       - Ability to search for users who are listening to specific artists or songs at the moment.
     - **Results Display**:
       - Search results show how well each found user matches the search criteria (percentage-wise).
     - **Search Personalization**:
       - AI suggestions based on user’s search history and preferences.

7. **Messenger Feature with AI Integration**

   - **Description**: A messaging system that allows users to communicate and include AI in their conversations.
   - **Key Features**:
     - **Real-Time Messaging**:
       - Text messaging capabilities.
     - **AI Integration**:
       - Users can include AI in conversations by pressing an AI button in the message window.
       - AI provides opinions or feedback based on the conversation or user queries and only if users (participants in the chat) choose and all agree to have AI express his opinion about the question they ask him.
     - **Instant Reactions**:
       - Option to send a “mystery message” and request real-time reaction (audio/video) when a message is read.
       - Capture instant audio or video responses to messages.
       - Mystery message is being sent. The moment the recipient opens decides and opens the message, the camera and audio start recording the face video. After the video is done, the recipient user can either choose to send the reaction video with audio or not.
     - **Anonymous Commenting**:
       - Users can comment anonymously on posts if the content creator allows it.
       - Content creators can choose whether anonymous comments are visible to themselves only, to friends, or to the public.
     - **Privacy and Security**:
       - Secure messaging with privacy controls.

8. **Privacy and Security Compliance**
   - **Description**: Adhere to legal requirements and best practices for data protection and user privacy.
   - **Key Features**:
     - **Regulatory Compliance**:
       - Compliance with GDPR, CCPA, and other international privacy laws.
     - **Data Encryption**:
       - Encrypt data at rest and in transit to protect user information.
     - **Access Controls**:
       - Implement strict access controls and authentication measures.
     - **Transparent Policies**:
       - Clear and accessible privacy policies and terms of service.
     - **Regular Audits**:
       - Conduct security audits and vulnerability assessments.

### Future Features

1. **Content Posting/Creation**

   - **Description**: Users can create and post content on the platform.
   - **Key Features**:
     - **Media Types**:
       - Users can post short or long videos, photos, and written content.
     - **Content Evaluation**:
       - Users choose the criteria to be rated by other users about the content they post.
       - Content can be rated in the criteria selected by the content creator.
       - Ratings are numerical and can be displayed or hidden based on user preference.
       - Users can also choose to hide likes and comments if they wish.
     - **Content Feedback from AI**:
       - Before uploading, users can opt to receive private feedback from AI on how to improve their content.
       - AI provides suggestions on improvements, optimal posting times, hashtags to use, and criteria selection.
       - **Special Video-Analyzing AI**:
         - AI processes uploaded content to gather more information for evaluations.
     - **Stories**:
       - Users can share temporary content similar to stories in other social apps.
     - **Anonymous Commenting**:
       - Content creators can allow anonymous commenting on their posts.
       - They can choose whether anonymous comments are visible to themselves only, to friends, or to the public.
     - **Privacy Settings**:
       - Users can choose who can view, rate, or comment on their content (public, friends, or private).

2. **User-Defined Content Rating Criteria**

   - **Description**: Users select the criteria by which their content is rated, positioning themselves as influencers in specific areas.
   - **Key Features**:
     - **Criteria Selection**:
       - Options for users to choose criteria that align with their personal brand (e.g., educational, entertaining, inspirational).
       - Ability to change or update criteria over time.
     - **Influencer Profiles**:
       - Profiles of influencers display the criteria they have had rated in their content.
     - **Customized Ratings**:
       - Content is rated by watching users based on the selected criteria.
       - Users can choose to show or hide ratings, likes, and comments.
     - **Separation of Evaluations**:
       - Evaluations and criteria of content are different from the evaluations of personal traits and characteristics.
       - Content is rated by users, while personal characteristics are evaluated by AI.
     - **Influencer Tools**:
       - Insights into audience engagement and preferences.
       - Tools to help users grow their influence in chosen areas.

3. **Following Other Users' Newsfeeds**

   - **Description**: Users can follow and view other users' customized newsfeeds, allowing them to see curated content.
   - **Key Features**:
     - **Follow Functionality**:
       - Ability to follow other users and subscribe to their feeds.
       - Notifications when followed users post new content.
     - **Feed Viewing**:
       - Access to other users' newsfeeds directly from their profiles.
     - **Interaction**:
       - Interaction with content through likes, comments, and shares.
     - **Discoverability**:
       - Suggestions of users to follow based on interests and mutual connections.

4. **AI Content Analysis and Optimization Tools**

   - **Description**: Provide AI-powered tools to analyze user content and offer improvements for better engagement.
   - **Key Features**:
     - **Content Quality Assessment**:
       - AI analyzes posts, images, and videos for quality and engagement potential before they are uploaded.
       - Provides scores or ratings based on selected criteria.
     - **Improvement Suggestions**:
       - Tips on how to enhance content (e.g., visual quality, messaging clarity).
       - Recommendations on optimal posting times for maximum visibility.
       - Suggested hashtags and keywords to increase reach.
     - **Virality Prediction**:
       - Estimates the potential of content to go viral based on current trends and analytics.
     - **User Guidance**:
       - Educational resources and tutorials on content creation.
     - **User Choice**:
       - Users decide whether to use the AI's assistance or not.

5. **Charity Coefficient Feature**
   - **Description**: A metric that reflects a user's engagement with charitable activities.
   - **Key Features**:
     - **Tracking Contributions**:
       - Record donations, volunteer hours, and other charitable actions.
     - **Profile Display**:
       - Users can choose to have the Charity Coefficient displayed on their profile (publicly or to friends only).
     - **Badges and Recognition**:
       - Earn badges or accolades for various levels of contribution.
       - Influencers can choose to donate a percentage of their earnings to charity.
       - Different badges awarded based on the amount and frequency of contributions.
     - **Leaderboard**:
       - A leaderboard to showcase top contributors within the community.
       - Users can opt-in to be featured on the leaderboard.
     - **Charity Partnerships**:
       - Collaborate with recognized charities to validate contributions.
       - Offer exclusive content or perks for users who contribute to partnered charities.
     - **Impact Reports**:
       - Generate reports showing the impact of user contributions.
       - Users can share these reports on social media to encourage others to contribute.
     - **Integration with Payment Platforms**:
       - Seamless integration with popular payment platforms for easy donations.
       - Track and verify donations made through the platform.
     - **Privacy Controls**:
       - Users can control the visibility of their contributions and Charity Coefficient.
       - Options to keep contributions private, share with friends, or make public.
     - **Community Challenges**:
       - Organize community challenges to encourage collective charitable actions.
       - Track progress and contributions towards a common goal.
     - **Notifications and Reminders**:
       - Notify users of upcoming charity events or opportunities to contribute.
       - Reminders for recurring donations or volunteer commitments.
     - **User Stories and Testimonials**:
       - Feature stories and testimonials from users about their charitable experiences.
       - Highlight the positive impact of contributions on the community.
       # Personalities

Personalities is a web application that allows users to explore and interact with various personality-related features, including Spotify integration, messaging, and AI-driven responses.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Docker](#docker)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

## Features

1. **User Authentication and Profile Management**

   - Secure user authentication and profile management.
   - Integration with social media accounts for easy login.

2. **Spotify Integration**

   - Fetch user data from Spotify.
   - Display top artists, tracks, and currently playing music.

3. **Messaging System**

   - Real-time chat with other users.
   - AI-driven responses for enhanced interaction.

4. **Rate Limiting**

   - Prevent abuse with global and advanced rate limiting.

5. **Charity Coefficient Feature**

   - **Description**: A metric that reflects a user's engagement with charitable activities.
   - **Key Features**:
     - **Tracking Contributions**:
       - Record donations, volunteer hours, and other charitable actions.
     - **Profile Display**:
       - Users can choose to have the Charity Coefficient displayed on their profile (publicly or to friends only).
     - **Badges and Recognition**:
       - Earn badges or accolades for various levels of contribution.
       - Influencers can choose to donate a percentage of their earnings to charity.
       - Different badges awarded based on the amount and frequency of contributions.
     - **Leaderboard**:
       - A leaderboard to showcase top contributors within the community.
       - Users can opt-in to be featured on the leaderboard.
     - **Charity Partnerships**:
       - Collaborate with recognized charities to validate contributions.
       - Offer exclusive content or perks for users who contribute to partnered charities.
     - **Impact Reports**:
       - Generate reports showing the impact of user contributions.
       - Users can share these reports on social media to encourage others to contribute.
     - **Integration with Payment Platforms**:
       - Seamless integration with popular payment platforms for easy donations.
       - Track and verify donations made through the platform.
     - **Privacy Controls**:
       - Users can control the visibility of their contributions and Charity Coefficient.
       - Options to keep contributions private, share with friends, or make public.
     - **Community Challenges**:
       - Organize community challenges to encourage collective charitable actions.
       - Track progress and contributions towards a common goal.
     - **Notifications and Reminders**:
       - Notify users of upcoming charity events or opportunities to contribute.
       - Reminders for recurring donations or volunteer commitments.
     - **User Stories and Testimonials**:
       - Feature stories and testimonials from users about their charitable experiences.
       - Highlight the positive impact of contributions on the community.

6. **Charity Page**

   - **Description**: A dedicated space for users to discover and participate in charity initiatives.
   - **Key Features**:
     - **Charity Listings**:
       - Information on various charities and causes.
     - **Donation Platform**:
       - Secure system to donate directly through the app.
     - **Event Participation**:
       - Sign up for charity events or volunteer opportunities.
     - **Impact Tracking**:
       - See the collective impact of the community's charitable efforts.

7. **Newsfeed of Videos**

   - **Description**: A personalized video newsfeed tailored to user interests and customized levels of criteria.
   - **Key Features**:
     - **Content Curation**:
       - AI curates videos based on the user's customized criteria levels and interests.
     - **Interaction**:
       - Users can like, comment on, and repost videos.
       - Users can share stories similar to other social apps.
     - **Customization**:
       - Users can customize newsfeeds according to the levels of different characteristics.
       - Example: Viewing videos with humor above 9 and intellect below 2.

8. **Map Radius Feature**

   - **Description**: Implement functionality for users to search for others based on characteristics within a specific geographic radius.
   - **Key Features**:
     - **Radius-Based Searches**:
       - Users can find and connect with others nearby.
     - **Map Integration**:
       - Visual representation of user locations on a map (respecting privacy settings).
     - **Privacy Controls**:
       - Users can choose whether to share their location and to what extent.

9. **Enhanced User Settings**

   - **Description**: Expanded settings for greater user control over their experience.
   - **Key Features**:
     - **Privacy Controls**:
       - Detailed settings for who can view or interact with user content.
     - **Notification Preferences**:
       - Customize alerts for messages, comments, likes, and more.
     - **Account Management**:
       - Options for account security, two-factor authentication, and data management.
     - **Customization**:
       - Themes, display preferences, and interface customization.

10. **Mobile App Development**

    - **Description**: Develop native mobile applications for iOS and Android platforms.
    - **Key Features**:
      - **Optimized Design**:
        - User interfaces designed specifically for mobile devices.
      - **Push Notifications**:
        - Real-time updates and alerts delivered to users’ devices.
      - **Offline Access**:
        - Limited functionality available without an internet connection.
      - **Device Integration**:
        - Utilize mobile features like cameras, GPS, and sensors.

11. **Integration with Additional APIs**

    - **Description**: Enhance functionality by integrating with other platforms and services.
    - **Key Features**:
      - **Social Media Connections**:
        - Integration with platforms like Twitter, Instagram, and Facebook (subject to policies).
      - **Content Sharing**:
        - Cross-posting capabilities to share content across platforms.
      - **Additional Services**:
        - Integration with services like YouTube for video content or Goodreads for book recommendations.

12. **Premium Features**

    - **Description**: Offer exclusive features through a subscription model to enhance the user experience.
    - **Key Features**:
      - **Advanced Analytics**:
        - In-depth insights into content performance and audience engagement.
      - **Enhanced AI Capabilities**:
        - Access to more sophisticated AI tools and personalized assistance.
      - **Customization Options**:
        - Additional themes, profile customization, and interface options.
      - **Ad-Free Experience**:
        - Remove advertisements for uninterrupted use.

13. **Testing and Quality Assurance**

    - **Description**: Ensure the application is reliable, secure, and provides a high-quality user experience.
    - **Key Features**:
      - **Automated Testing**:
        - Implement unit tests, integration tests, and end-to-end tests.
      - **Manual Testing**:
        - User acceptance testing and beta testing with real users.
      - **Performance Monitoring**:
        - Continuous monitoring to detect and resolve issues promptly.
      - **Feedback Loops**:
        - Collect user feedback to inform improvements and updates.

14. **Evaluations by Friends in Different Criteria**
    - **Description**: Allow friends to evaluate users based on different criteria.
    - **Key Features**:
      - **Criteria-Based Evaluations**:
        - Friends can rate users on various characteristics.
      - **Feedback Display**:
        - Display evaluations on user profiles (with privacy controls).
      - **Aggregate Scores**:
        - Calculate and display aggregate scores for each criterion.

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
