import React from 'react';
import { Link } from 'react-router-dom';

// Define the type for the charity prop
interface Charity {
  id: string;
  name: string;
  description: string;
  donationGoal: number;
  amountRaised: number;
}

interface CharityProfileProps {
  charity: Charity | null; // charity can be null
}

const CharityProfile: React.FC<CharityProfileProps> = ({ charity }) => {
  if (!charity) return null;

  return (
    <div className="charity-profile">
      <h2>{charity.name}</h2>
      <p>{charity.description}</p>
      <p>Donation Goal: ${charity.donationGoal.toLocaleString()}</p>
      <p>Amount Raised: ${charity.amountRaised.toLocaleString()}</p>
      <Link to={`/donate/${charity.id}`} className="donate-button">
        Donate
      </Link>
    </div>
  );
};

export default CharityProfile;
