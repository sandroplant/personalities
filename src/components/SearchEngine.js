import React, { useState } from 'react';

const Search = ({ profiles, criteriaOptions }) => {
    const [searchParams, setSearchParams] = useState({
        selectedCriteria: {},
        spotifyData: { topArtists: [], topSongs: [], currentSong: '' },
        favoriteMovies: [],
        favoriteBooks: [],
        appearance: { hairColor: '', eyeColor: '', height: '', weight: '', bodyType: '' },
        hobbies: [],
        interests: [],
        profession: '',
        education: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleCriteriaChange = (criteriaName, value) => {
        setSearchParams(prevState => ({
            ...prevState,
            selectedCriteria: {
                ...prevState.selectedCriteria,
                [criteriaName]: value
            }
        }));
    };

    const handleSearch = () => {
        // Implement search logic here
    };

    return (
        <div>
            <h2>Search Profiles</h2>

            {/* Criteria Selection */}
            <div>
                {Object.keys(criteriaOptions).map((criteria, index) => (
                    <div key={index}>
                        <label>{criteria}</label>
                        <input 
                            type="range"
                            min="1"
                            max="10"
                            step="0.1"
                            value={searchParams.selectedCriteria[criteria] || 1}
                            onChange={(e) => handleCriteriaChange(criteria, e.target.value)}
                        />
                    </div>
                ))}
            </div>

            {/* Spotify Data */}
            <div>
                <label>Top Artists</label>
                <select name="topArtists" onChange={handleInputChange}>
                    {searchParams.spotifyData.topArtists.map((artist, index) => (
                        <option key={index} value={artist}>{artist}</option>
                    ))}
                </select>

                <label>Top Songs</label>
                <select name="topSongs" onChange={handleInputChange}>
                    {searchParams.spotifyData.topSongs.map((song, index) => (
                        <option key={index} value={song}>{song}</option>
                    ))}
                </select>

                <label>Current Song</label>
                <input type="text" name="currentSong" value={searchParams.spotifyData.currentSong} onChange={handleInputChange} />
            </div>

            {/* Favorite Movies */}
            <div>
                <label>Favorite Movies</label>
                <input type="text" name="favoriteMovies" value={searchParams.favoriteMovies.join(', ')} onChange={handleInputChange} />
            </div>

            {/* Favorite Books */}
            <div>
                <label>Favorite Books</label>
                <input type="text" name="favoriteBooks" value={searchParams.favoriteBooks.join(', ')} onChange={handleInputChange} />
            </div>

            {/* Appearance */}
            <div>
                <label>Hair Color</label>
                <select name="hairColor" onChange={handleInputChange}>
                    {/* Add options for hair colors */}
                </select>

                <label>Eye Color</label>
                <select name="eyeColor" onChange={handleInputChange}>
                    {/* Add options for eye colors */}
                </select>

                <label>Height</label>
                <input type="number" name="height" value={searchParams.appearance.height} onChange={handleInputChange} />

                <label>Weight</label>
                <input type="number" name="weight" value={searchParams.appearance.weight} onChange={handleInputChange} />

                <label>Body Type</label>
                <select name="bodyType" onChange={handleInputChange}>
                    {/* Add options for body types */}
                </select>
            </div>

            {/* Hobbies */}
            <div>
                <label>Hobbies</label>
                <input type="text" name="hobbies" value={searchParams.hobbies.join(', ')} onChange={handleInputChange} />
            </div>

            {/* Interests */}
            <div>
                <label>Interests</label>
                <input type="text" name="interests" value={searchParams.interests.join(', ')} onChange={handleInputChange} />
            </div>

            {/* Profession */}
            <div>
                <label>Profession</label>
                <input type="text" name="profession" value={searchParams.profession} onChange={handleInputChange} />
            </div>

            {/* Education */}
            <div>
                <label>Education</label>
                <input type="text" name="education" value={searchParams.education} onChange={handleInputChange} />
            </div>

            <button onClick={handleSearch}>Search</button>
        </div>
    );
};

export default Search;
