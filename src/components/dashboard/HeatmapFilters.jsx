// src/components/dashboard/HeatmapFilters.jsx
import React from 'react';
import Select from 'react-select';
import { AsyncPaginate } from 'react-select-async-paginate';
import { loadPaginatedProjects } from '../../services/api';


// Styles for react-select (adjust colors to match your theme.css or Tailwind)
const selectStyles = {
    control: (provided) => ({
        ...provided,
        backgroundColor: '#161B22', // dark-card equivalent
        borderColor: '#30363D', // dark-border equivalent
        color: '#C9D1D9', // dark-text equivalent
        minWidth: '150px',
        boxShadow: 'none',
        '&:hover': {
            borderColor: '#58A6FF' // accent-blue on hover
        },
        transition: 'border-color 0.2s ease-in-out',
    }),
    menu: (provided) => ({
        ...provided,
        backgroundColor: '#161B22', // dark-card
        zIndex: 50 // Ensure menu is above chart
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#58A6FF' : state.isFocused ? '#30363D' : '#161B22',
        color: state.isSelected ? '#FFFFFF' : '#C9D1D9', // white text when selected
        ':active': { // Prevent blue flash on click
            backgroundColor: state.isSelected ? '#58A6FF' : '#404854'
        }
    }),
    loadingMessage: (provided) => ({
        ...provided,
        color: '#8B949E', // dark-text-secondary
        minHeight: '40px', // Garante uma altura mínima para evitar colapso
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }),
    // [NOVO] Estilo para o indicador de carregamento (os 3 pontos)
    loadingIndicator: (provided) => ({
        ...provided,
        color: '#58A6FF', // accent-blue
    }),
    multiValue: (provided) => ({ ...provided, backgroundColor: '#30363D' }),
    multiValueLabel: (provided) => ({ ...provided, color: '#C9D1D9' }),
    multiValueRemove: (provided) => ({
        ...provided,
        color: '#8B949E', // dark-text-secondary
        ':hover': {
            backgroundColor: '#58A6FF', // accent-blue
            color: 'white',
        },
    }),
    input: (provided) => ({ ...provided, color: '#C9D1D9' }),
    placeholder: (provided) => ({ ...provided, color: '#8B949E' }), // dark-text-secondary
    singleValue: (provided) => ({ ...provided, color: '#C9D1D9' }),
    indicatorSeparator: () => ({ display: 'none' }), // Hide the separator
    dropdownIndicator: (provided) => ({ ...provided, color: '#8B949E', ':hover': { color: '#C9D1D9' } }), // Style dropdown arrow
};

const HeatmapFilters = ({
    allYears,
    allCountries,
    selectedYears,
    selectedCountryIds,
    selectedProjectIds,
    selectedObjective,
    selectedView,
    onYearChange,
    onCountryChange,
    onProjectChange,
    onObjectiveChange,
    onViewChange,
}) => {
    // --- Options for Selectors ---
    // Remove "Todos os Anos" para o multi-select
    const yearOptions = allYears.map(year => ({ value: year, label: year.toString() }));
    const countryOptions = allCountries.map(country => ({ value: country.id, label: country.name }));

    const objectiveOptions = [
        { value: 'all', label: 'Todos Objetivos' },
        { value: 'adaptation', label: 'Adaptação' },
        { value: 'mitigation', label: 'Mitigação' },
        { value: 'both', label: 'Ambos' },
    ];

    const viewOptions = [
        { value: 'country_year', label: 'Linhas: Países | Colunas: Anos' },
        { value: 'year_country', label: 'Linhas: Anos | Colunas: Países' },
    ];

    // --- Helper to get selected option object for react-select ---
    // getSelectedOption (para single-select)
    const getSelectedOption = (options, value) => options.find(opt => opt.value === value) || null;
    // getSelectedOptions (para multi-select)
    const getSelectedOptions = (options, values) => options.filter(opt => values.includes(opt.value));
    const handleProjectChange = (selectedOptions) => {
        onProjectChange(selectedOptions ? selectedOptions.map(opt => opt.value) : []);
    };

    const selectedProjectObjects = selectedProjectIds.map(id => {
         return { value: id, label: `Projeto ID: ${id}` };
    });

    return (
        <div className="flex flex-wrap gap-4 p-4 bg-dark-card rounded-lg shadow mb-4 items-center transition-all duration-200 ease-in-out">
            
            {/* Year Filter (Multi Select) */}
            <div className="flex-grow min-w-[150px]">
                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Anos</label>
                <Select
                    isMulti
                    options={yearOptions}
                    value={getSelectedOptions(yearOptions, selectedYears)}
                    onChange={(selectedOptions) => onYearChange(selectedOptions.map(opt => opt.value))}
                    styles={selectStyles}
                    placeholder="Todos os Anos"
                    closeMenuOnSelect={false}
                />
            </div>

            {/* Country Filter (Multi Select) */}
            <div className="flex-grow min-w-[200px]">
                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Países</label>
                <Select
                    isMulti
                    options={countryOptions}
                    value={getSelectedOptions(countryOptions, selectedCountryIds)}
                    onChange={(selectedOptions) => onCountryChange(selectedOptions.map(opt => opt.value))}
                    styles={selectStyles}
                    placeholder="Todos os Países"
                    closeMenuOnSelect={false}
                />
            </div>

            {/* Project Filter (Multi Select) */}
            <div className="w-[280px] min-w-[200px] min-h-[60px] max-h-[60px]">
                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Projetos</label>
                 <AsyncPaginate
                    isMulti
                    value={selectedProjectObjects}
                    loadOptions={loadPaginatedProjects}
                    onChange={handleProjectChange}
                    styles={selectStyles}
                    placeholder="Buscar e selecionar projetos..."
                    closeMenuOnSelect={false}
                    debounceTimeout={300}
                    additional={{ page: 0 }}
                    loadingMessage={() => 'Carregando mais projetos...'}
                 />
            </div>

            {/* Objective Filter (Single Select) */}
            <div className="flex-grow min-w-[150px]">
                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Objetivo</label>
                <Select
                    options={objectiveOptions}
                    value={getSelectedOption(objectiveOptions, selectedObjective)}
                    onChange={(selectedOption) => onObjectiveChange(selectedOption ? selectedOption.value : 'all')}
                    styles={selectStyles}
                    placeholder="Todos Objetivos"
                />
            </div>

            {/* View Filter (Single Select) */}
            <div className="flex-grow min-w-[250px]">
                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Visualização</label>
                <Select
                    options={viewOptions}
                    value={getSelectedOption(viewOptions, selectedView)}
                    onChange={(selectedOption) => onViewChange(selectedOption ? selectedOption.value : 'country_year')}
                    styles={selectStyles}
                    placeholder="Selecionar Visão"
                />
            </div>
        </div>
    );
};

export default HeatmapFilters;
