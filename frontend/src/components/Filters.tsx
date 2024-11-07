import React, { ChangeEvent, FormEvent } from 'react';

interface FiltersProps {
  onFilterChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onApplyFilters: (e: FormEvent<HTMLFormElement>) => void;
}

const Filters: React.FC<FiltersProps> = ({
  onFilterChange,
  onApplyFilters,
}) => {
  return (
    <div>
      <h3>Filters</h3>
      <form onSubmit={onApplyFilters}>
        {/* Criteria Selection */}
        <div>
          <label htmlFor="criteria">Criteria:</label>
          <select id="criteria" name="criteria" onChange={onFilterChange}>
            <option value="humor">Humor</option>
            <option value="open_mindedness">Open-Mindedness</option>
            <option value="wisdom">Wisdom</option>
            <option value="adventurousness">Adventurousness</option>
            <option value="responsibility">Responsibility</option>
            {/* Add more criteria as needed */}
          </select>
        </div>

        {/* Dropdowns for User Details */}
        <div>
          <label htmlFor="hairColor">Hair Color:</label>
          <select id="hairColor" name="hairColor" onChange={onFilterChange}>
            <option value="blonde">Blonde</option>
            <option value="brunette">Brunette</option>
            <option value="black">Black</option>
            <option value="red">Red</option>
            <option value="gray">Gray</option>
            {/* Add more hair colors as needed */}
          </select>
        </div>

        <div>
          <label htmlFor="eyeColor">Eye Color:</label>
          <select id="eyeColor" name="eyeColor" onChange={onFilterChange}>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="brown">Brown</option>
            <option value="gray">Gray</option>
            <option value="hazel">Hazel</option>
            {/* Add more eye colors as needed */}
          </select>
        </div>

        <div>
          <label htmlFor="height">Height (cm):</label>
          <input
            type="number"
            id="height"
            name="height"
            onChange={onFilterChange}
          />
        </div>

        <div>
          <label htmlFor="weight">Weight (kg):</label>
          <input
            type="number"
            id="weight"
            name="weight"
            onChange={onFilterChange}
          />
        </div>

        {/* More filters can be added as needed */}

        <button type="submit">Apply Filters</button>
      </form>
    </div>
  );
};

export default Filters;
