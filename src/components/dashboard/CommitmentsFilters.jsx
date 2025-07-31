// src/components/Dashboard/Filters.jsx
import React from 'react';
import Select from 'react-select';

// Estilos customizados para o react-select combinar com o tema escuro
const selectStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: '#0D1117',
    borderColor: '#30363D',
    color: '#C9D1D9',
    minWidth: '250px',
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: '#161B22',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#58A6FF' : state.isFocused ? '#30363D' : '#161B22',
    color: '#C9D1D9',
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#30363D',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: '#C9D1D9',
  }),
  input: (provided) => ({
      ...provided,
      color: '#C9D1D9',
  }),
  placeholder: (provided) => ({
      ...provided,
      color: '#8B949E'
  })
};

const Filters = ({ years, countries, selectedYears, selectedCountries, onYearChange, onCountryChange }) => {
    const yearOptions = years.map(year => ({ value: year, label: year }));
    const countryOptions = countries.map(country => ({ value: country, label: country }));

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Anos</label>
                <Select
                    isMulti
                    options={yearOptions}
                    value={yearOptions.filter(opt => selectedYears.includes(opt.value))}
                    onChange={selected => onYearChange(selected.map(opt => opt.value))}
                    styles={selectStyles}
                    placeholder="Todos os anos"
                />
            </div>
            <div className="flex-1">
                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Países (Receptor)</label>
                <Select
                    isMulti
                    options={countryOptions}
                    value={countryOptions.filter(opt => selectedCountries.includes(opt.value))}
                    onChange={selected => onCountryChange(selected.map(opt => opt.value))}
                    styles={selectStyles}
                    placeholder="Selecione um ou mais países..."
                />
            </div>
        </div>
    );
};

export default Filters;