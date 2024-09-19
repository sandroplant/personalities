import React, { useState } from 'react';

const Profile = () => {
  const [profileData, setProfileData] = useState({
    humor: '',
    adventurousness: '',
    height: '',
    weight: '',
    hairColor: '',
    eyeColor: '',
    skinColor: '',
    music: '',
    movies: '',
    books: '',
    hobbies: '',
    interests: '',
    profession: '',
    education: '',
    privacy: 'friends', // Default privacy setting
  });

  const criteriaOptions = [
    'Humor', 'Adventurousness', 'Wisdom', 'Open-mindedness', 'Responsibility'
  ];

  const dropdownOptions = {
    height: ['Short', 'Average', 'Tall'],
    weight: ['Underweight', 'Normal', 'Overweight'],
    hairColor: ['Blonde', 'Brunette', 'Red', 'Black', 'Gray'],
    eyeColor: ['Blue', 'Green', 'Brown', 'Gray', 'Hazel'],
    skinColor: ['Pale', 'Light', 'Medium', 'Dark'],
    hobbies: ['Reading', 'Sports', 'Traveling', 'Music', 'Cooking'],
    interests: ['Technology', 'Art', 'Science', 'History', 'Music'],
    profession: ['Engineer', 'Doctor', 'Artist', 'Teacher', 'Entrepreneur'],
    education: ['High School', 'Associate Degree', 'Bachelor’s Degree', 'Master’s Degree', 'PhD'],
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div>
      <h1>User Profile</h1>
      <form>
        {criteriaOptions.map((option) => (
          <label key={option}>
            {option}:
            <input
              type="number"
              name={option.toLowerCase()}
              min="1"
              max="10"
              value={profileData[option.toLowerCase()]}
              onChange={handleChange}
            />
          </label>
        ))}

        {Object.keys(dropdownOptions).map((key) => (
          <label key={key}>
            {key.charAt(0).toUpperCase() + key.slice(1)}:
            <select
              name={key}
              value={profileData[key]}
              onChange={handleChange}
            >
              <option value="">Select...</option>
              {dropdownOptions[key].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        ))}

        <label>
          Music:
          <input
            type="text"
            name="music"
            value={profileData.music}
            onChange={handleChange}
          />
        </label>
        <label>
          Movies:
          <input
            type="text"
            name="movies"
            value={profileData.movies}
            onChange={handleChange}
          />
        </label>
        <label>
          Books:
          <input
            type="text"
            name="books"
            value={profileData.books}
            onChange={handleChange}
          />
        </label>
        <label>
          Hobbies:
          <input
            type="text"
            name="hobbies"
            value={profileData.hobbies}
            onChange={handleChange}
          />
        </label>
        <label>
          Interests:
          <input
            type="text"
            name="interests"
            value={profileData.interests}
            onChange={handleChange}
          />
        </label>
        <label>
          Profession:
          <input
            type="text"
            name="profession"
            value={profileData.profession}
            onChange={handleChange}
          />
        </label>
        <label>
          Education:
          <input
            type="text"
            name="education"
            value={profileData.education}
            onChange={handleChange}
          />
        </label>

        <label>
          Privacy:
          <select
            name="privacy"
            value={profileData.privacy}
            onChange={handleChange}
          >
            <option value="friends">Friends</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>

        <button type="submit">Save Profile</button>
      </form>
    </div>
  );
};

export default Profile;
