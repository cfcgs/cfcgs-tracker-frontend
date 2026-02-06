// src/components/Dashboard/Filters.jsx
import React, { useRef } from 'react';
import Select from 'react-select';

// Estilos customizados para o react-select combinar com o tema escuro
const CONTROL_HEIGHT = 44;
const selectStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: '#0D1117',
    borderColor: '#30363D',
    color: '#C9D1D9',
    minWidth: '250px',
    minHeight: `${CONTROL_HEIGHT}px`,
    maxHeight: `${CONTROL_HEIGHT}px`,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: '#161B22',
    width: '100%',
    maxWidth: '100%',
  }),
  menuList: (provided) => ({
    ...provided,
    maxHeight: '280px',
    overflowY: 'auto',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#58A6FF' : state.isFocused ? '#30363D' : '#161B22',
    color: '#C9D1D9',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#30363D',
    margin: '2px 4px 2px 0',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: '#C9D1D9',
    maxWidth: '140px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  singleValue: (provided) => ({
    ...provided,
    maxWidth: '160px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  valueContainer: (provided) => ({
    ...provided,
    maxHeight: `${CONTROL_HEIGHT - 6}px`,
    overflowY: 'auto',
    paddingTop: 2,
    paddingBottom: 2,
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
    const menuInteractionRef = useRef({});
    const markMenuOpen = (key) => () => {
        menuInteractionRef.current[key] = true;
    };
    const markMenuClose = (key) => () => {
        if (!menuInteractionRef.current[key]) return;
        menuInteractionRef.current[key] = false;
        if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('tour:filter-change', {
                detail: {
                    stepId: 'commitments-filters',
                    filter: key,
                    filled: true,
                },
            }));
        }
    };
    const yearOptions = years.map(year => ({ value: year, label: year }));
    const countryOptions = countries.map(country => ({ value: country, label: country }));

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6" data-tour="commitments-filters">
            <div className="flex-1">
                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Anos</label>
                <Select
                    isMulti
                    options={yearOptions}
                    value={yearOptions.filter(opt => selectedYears.includes(opt.value))}
                    onChange={selected => {
                        onYearChange(selected ? selected.map(opt => opt.value) : []);
                        if (typeof document !== 'undefined') {
                            document.dispatchEvent(new CustomEvent('tour:filter-change', {
                                detail: {
                                    stepId: 'commitments-filters',
                                    filter: 'years',
                                    filled: Boolean(selected?.length),
                                },
                            }));
                        }
                    }}
                    onMenuOpen={markMenuOpen('years')}
                    onMenuClose={markMenuClose('years')}
                    classNamePrefix="cf-select"
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
                    onChange={selected => {
                        onCountryChange(selected ? selected.map(opt => opt.value) : []);
                        if (typeof document !== 'undefined') {
                            document.dispatchEvent(new CustomEvent('tour:filter-change', {
                                detail: {
                                    stepId: 'commitments-filters',
                                    filter: 'countries',
                                    filled: Boolean(selected?.length),
                                },
                            }));
                        }
                    }}
                    onMenuOpen={markMenuOpen('countries')}
                    onMenuClose={markMenuClose('countries')}
                    classNamePrefix="cf-select"
                    styles={selectStyles}
                    placeholder="Selecione um ou mais países..."
                />
            </div>
        </div>
    );
};

export default Filters;
