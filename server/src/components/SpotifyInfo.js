// src/components/SpotifyInfo.js
import React from 'react';

const SpotifyInfo = ({ user }) => {
    const {
        topArtists,
        topSongs,
        currentSong,
        recentSong
    } = user.spotifyInfo;

    return (
        <div className="spotify-info">
            <h3>Spotify Information</h3>
            <div>
                <h4>Top Artists</h4>
                <ul>
                    {topArtists.map((artist, index) => (
                        <li key={index}>{artist}</li>
                    ))}
                </ul>
            </div>
            <div>
                <h4>Top Songs</h4>
                <ul>
                    {topSongs.map((song, index) => (
                        <li key={index}>{song}</li>
                    ))}
                </ul>
            </div>
            <div>
                <h4>Current Song</h4>
                <p>{currentSong}</p>
            </div>
            <div>
                <h4>Recently Played Song</h4>
                <p>{recentSong}</p>
            </div>
        </div>
    );
};

export default SpotifyInfo;
