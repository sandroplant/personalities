import React from 'react';

interface User {
  activityTime: number;
  donations: number;
}

interface CharitabilityCoefficientProps {
  user: User;
}

const CharitabilityCoefficient: React.FC<CharitabilityCoefficientProps> = ({
  user,
}: CharitabilityCoefficientProps): React.ReactElement => {
  // Example logic for calculating the charity coefficient
  const calculateCharitability = (): number => {
    let coefficient = 0;
    // Replace this with actual calculation logic based on user data
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

export default CharitabilityCoefficient;
