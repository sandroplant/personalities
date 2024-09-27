import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const CharityProfile = ({ charity }) => {
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

CharityProfile.propTypes = {
  charity: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    donationGoal: PropTypes.number.isRequired,
    amountRaised: PropTypes.number.isRequired,
  }).isRequired,
};

export default CharityProfile;
