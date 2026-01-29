import React from 'react';
import Select from 'react-select';

// Estilos customizados para o react-select (pode ser movido para um arquivo separado)
const selectStyles = {
  control: (provided) => ({ ...provided, backgroundColor: '#0D1117', borderColor: '#30363D', color: '#C9D1D9', minWidth: '200px' }),
  menu: (provided) => ({ ...provided, backgroundColor: '#161B22' }),
  option: (provided, state) => ({ ...provided, backgroundColor: state.isSelected ? '#58A6FF' : state.isFocused ? '#30363D' : '#161B22', color: '#C9D1D9' }),
  multiValue: (provided) => ({ ...provided, backgroundColor: '#30363D' }),
  multiValueLabel: (provided) => ({ ...provided, color: '#C9D1D9' }),
  input: (provided) => ({ ...provided, color: '#C9D1D9' }),
  placeholder: (provided) => ({ ...provided, color: '#8B949E' })
};

const ObjectiveFilters = ({ years, countries, objectives, selectedYears, selectedCountries, selectedObjectives, onYearChange, onCountryChange, onObjectiveChange }) => {
    const yearOptions = years.map(year => ({ value: year, label: year }));
    const countryOptions = countries.map(country => ({ value: country.id, label: country.name }));
    const objectiveOptions = objectives.map(obj => ({ value: obj, label: obj }));

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4" data-tour="objective-filters">
            {/* Filtro de Ano */}
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
                                    stepId: 'objective-filters',
                                    filter: 'years',
                                    filled: Boolean(selected?.length),
                                },
                            }));
                        }
                    }}
                    styles={selectStyles}
                    placeholder="Todos os Anos"
                />
            </div>
            {/* Filtro de País */}
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
                                    stepId: 'objective-filters',
                                    filter: 'countries',
                                    filled: Boolean(selected?.length),
                                },
                            }));
                        }
                    }}
                    styles={selectStyles}
                    placeholder="Todos os Países"
                />
            </div>
            {/* Filtro de Objetivo */}
            <div className="flex-1">
                 <label className="block text-sm font-medium text-dark-text-secondary mb-1">Objetivos</label>
                <Select
                    isMulti
                    options={objectiveOptions}
                    value={objectiveOptions.filter(opt => selectedObjectives.includes(opt.value))}
                    onChange={selected => {
                        onObjectiveChange(selected ? selected.map(opt => opt.value) : []);
                        if (typeof document !== 'undefined') {
                            document.dispatchEvent(new CustomEvent('tour:filter-change', {
                                detail: {
                                    stepId: 'objective-filters',
                                    filter: 'objectives',
                                    filled: Boolean(selected?.length),
                                },
                            }));
                        }
                    }}
                    styles={selectStyles}
                    placeholder="Todos os Objetivos"
                />
            </div>
        </div>
    );
};

export default ObjectiveFilters;
