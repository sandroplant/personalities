import React, { useState } from 'react';
import options from '../config/options';

const ProfileForm = () => {
    const [profile, setProfile] = useState({
        fullName: '',
        bio: '',
        criteria: { humor: '', adventurousness: '' },
        spotifyInfo: { topArtists: [], topSongs: [], currentPlayback: '' },
        favoriteMovies: [],
        favoriteBooks: [],
        appearance: { eyeColor: '', height: '', weight: '', bodyType: '', hairColor: '', skinColor: '' },
        hobbies: [],
        interests: [],
        profession: '',
        education: '',
        privacySettings: {
            spotifyInfo: 'private',
            favoriteMovies: 'private',
            favoriteBooks: 'private',
            appearance: 'private',
            hobbies: 'private',
            interests: 'private',
            profession: 'private',
            education: 'private'
        },
    });

    // Handle form submission and other logic here

    return (
        <form>
            {/* Render input fields for all profile data */}
            <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                placeholder="Full Name"
            />
            {/* Repeat for other fields */}
            {/* Include dropdowns for hobbies, interests, etc., using options from the config */}
        </form>
    );
};

export default ProfileForm;
