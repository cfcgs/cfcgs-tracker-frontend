import React from 'react';

const Filters = ({
  fundTypes,
  fundFocuses,
  selectedTypes,
  selectedFocuses,
  onTypeChange,
  onFocusChange
}) => {
  return (
    <div className="filters-container">
      <div className="filter-container">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Funds Status Filters</h2>
        <h3>Fund Types</h3>
        <div className="filter-group">
          {fundTypes.map(type => (
            <div key={type.id} className="filter-item">
              <input
                type="checkbox"
                id={`type-${type.id}`}
                checked={selectedTypes.includes(type.id)}
                onChange={() => onTypeChange(type.id)}
              />
              <label htmlFor={`type-${type.id}`}>{type.name}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="filter-container">
        <h3>Fund Focuses</h3>
        <div className="filter-group">
          {fundFocuses.map(focus => (
            <div key={focus.id} className="filter-item">
              <input
                type="checkbox"
                id={`focus-${focus.id}`}
                checked={selectedFocuses.includes(focus.id)}
                onChange={() => onFocusChange(focus.id)}
              />
              <label htmlFor={`focus-${focus.id}`}>{focus.name}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Filters;