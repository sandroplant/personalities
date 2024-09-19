import React from 'react';
import { Link } from 'react-router-dom';

const CharityProfile = ({ charity }) => {
  if (!charity) return null;

  return (
    <div className="charity-profile">
      <h2>{charity.name}</h2>
      <p>{charity.description}</p>
      <p>Donation Goal: ${charity.donationGoal}</p>
      <p>Amount Raised: ${charity.amountRaised}</p>
      <Link to={`/donate/${charity.id}`} className="donate-button">Donate</Link>
    </div>
  );
};

export default CharityProfile;
