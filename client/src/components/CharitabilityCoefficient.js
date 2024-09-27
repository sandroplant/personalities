import React from 'react';
import PropTypes from 'prop-types';

const CharitabilityCoefficient = ({ user }) => {
  // Example logic for calculating the charity coefficient
  const calculateCharitability = () => {
    let coefficient = 0;
    // Calculate based on user activity, donations, etc.
    // This is a placeholder logic, you need to replace it with actual calculation
    if (user) {
      coefficient = user.activityTime / 100 + user.donations / 100;
    }
    return coefficient;
  };

  const charitability = calculateCharitability();

  return (
    <div className="charitability-coefficient">
      <h2>Charitability Coefficient</h2>
      <p>{charitability.toFixed(2)}</p>
    </div>
  );
};

CharitabilityCoefficient.propTypes = {
  user: PropTypes.shape({
    activityTime: PropTypes.number.isRequired,
    donations: PropTypes.number.isRequired,
  }).isRequired,
};

export default CharitabilityCoefficient;
