// src/components/dashboard/HeatmapFilters.jsx
import React, { useMemo, useRef } from 'react';
import Select, { components } from 'react-select';
import { AsyncPaginate } from 'react-select-async-paginate';
import { loadPaginatedProjects } from '../../services/api';


// Styles for react-select (adjust colors to match your theme.css or Tailwind)
const CONTROL_HEIGHT = 48;
const selectStyles = {
    container: (provided) => ({
        ...provided,
        width: '100%',
        maxWidth: '100%',
    }),
    control: (provided) => ({
        ...provided,
        backgroundColor: '#161B22', // dark-card equivalent
        borderColor: '#30363D', // dark-border equivalent
        color: '#C9D1D9', // dark-text equivalent
        minWidth: '150px',
        minHeight: `${CONTROL_HEIGHT}px`,
        maxHeight: `${CONTROL_HEIGHT}px`,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        boxShadow: 'none',
        '&:hover': {
            borderColor: '#58A6FF' // accent-blue on hover
        },
        transition: 'border-color 0.2s ease-in-out',
    }),
    menu: (provided) => ({
        ...provided,
        backgroundColor: '#161B22', // dark-card
        zIndex: 50,
    }),
    menuList: (provided) => ({
        ...provided,
        maxHeight: '280px',
        overflowY: 'auto',
    }),
    menuPortal: (provided) => ({
        ...provided,
        zIndex: 9999,
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#58A6FF' : state.isFocused ? '#30363D' : '#161B22',
        color: state.isSelected ? '#FFFFFF' : '#C9D1D9', // white text when selected
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
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
    multiValue: (provided) => ({ ...provided, backgroundColor: '#30363D', margin: '2px 4px 2px 0' }),
    multiValueLabel: (provided) => ({
        ...provided,
        color: '#C9D1D9',
        maxWidth: '140px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    }),
    multiValueRemove: (provided) => ({
        ...provided,
        color: '#8B949E', // dark-text-secondary
        ':hover': {
            backgroundColor: '#58A6FF', // accent-blue
            color: 'white',
        },
    }),
    valueContainer: (provided) => ({
        ...provided,
        maxHeight: `${CONTROL_HEIGHT - 6}px`,
        overflowY: 'auto',
        paddingTop: 2,
        paddingBottom: 2,
    }),
    input: (provided) => ({ ...provided, color: '#C9D1D9' }),
    placeholder: (provided) => ({ ...provided, color: '#8B949E' }), // dark-text-secondary
    singleValue: (provided) => ({
        ...provided,
        color: '#C9D1D9',
        maxWidth: '160px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    }),
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
    availableObjectives,
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
    const filteredObjectiveOptions = useMemo(() => {
        if (!availableObjectives || availableObjectives.length === 0) {
            return objectiveOptions;
        }
        const set = new Set(availableObjectives);
        return objectiveOptions.filter((opt) => opt.value === 'all' || set.has(opt.value));
    }, [availableObjectives, objectiveOptions]);

    const viewOptions = [
        { value: 'country_year', label: 'Linhas: Países | Colunas: Anos' },
        { value: 'year_country', label: 'Linhas: Anos | Colunas: Países' },
    ];

    // --- Helper to get selected option object for react-select ---
    // getSelectedOption (para single-select)
    const getSelectedOption = (options, value) => options.find(opt => opt.value === value) || null;
    // getSelectedOptions (para multi-select)
    const getSelectedOptions = (options, values) => options.filter(opt => values.includes(opt.value));
    const projectOptionCacheRef = useRef(new Map());
    const selectComponents = useMemo(() => ({
        MultiValueLabel: (props) => (
            <components.MultiValueLabel
                {...props}
                innerProps={{
                    ...props.innerProps,
                    title: props.data?.label,
                }}
            />
        ),
    }), []);
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
                    stepId: 'heatmap-filters',
                    filter: key,
                    filled: true,
                },
            }));
        }
    };

    const handleProjectChange = (selectedOptions) => {
        if (selectedOptions?.length) {
            selectedOptions.forEach((opt) => {
                projectOptionCacheRef.current.set(opt.value, opt.label);
            });
        }
        onProjectChange(selectedOptions ? selectedOptions.map(opt => opt.value) : []);
        if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('tour:filter-change', {
                detail: {
                    stepId: 'heatmap-filters',
                    filter: 'projects',
                    filled: Boolean(selectedOptions?.length),
                },
            }));
        }
    };

    const selectedProjectObjects = selectedProjectIds.map(id => {
        const label = projectOptionCacheRef.current.get(id) || `Projeto ${id}`;
        return { value: id, label };
    });
    const viewSelectStyles = useMemo(() => ({
        ...selectStyles,
        singleValue: (provided) => ({
            ...provided,
            color: '#C9D1D9',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        }),
    }), []);
    const loadProjectOptions = async (search, loadedOptions, additional) => {
        const result = await loadPaginatedProjects(search, loadedOptions, {
            ...additional,
            filters: {},
        });
        result.options?.forEach((opt) => {
            projectOptionCacheRef.current.set(opt.value, opt.label);
        });
        return result;
    };

    return (
        <div
            className="flex flex-col gap-3 p-4 bg-dark-card rounded-lg shadow mb-4 items-stretch transition-all duration-200 ease-in-out"
            data-tour="heatmap-filters"
        >
            <div className="flex flex-wrap gap-4 items-center">
                {/* Year Filter (Multi Select) */}
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-sm font-medium text-dark-text-secondary mb-1">Anos</label>
                    <Select
                        isMulti
                        options={yearOptions}
                        value={getSelectedOptions(yearOptions, selectedYears)}
                        onChange={(selectedOptions) => {
                            onYearChange(selectedOptions.map(opt => opt.value));
                            if (typeof document !== 'undefined') {
                                document.dispatchEvent(new CustomEvent('tour:filter-change', {
                                    detail: {
                                        stepId: 'heatmap-filters',
                                        filter: 'years',
                                        filled: Boolean(selectedOptions?.length),
                                    },
                                }));
                            }
                        }}
                        onMenuOpen={markMenuOpen('years')}
                        onMenuClose={markMenuClose('years')}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        classNamePrefix="cf-select"
                        components={selectComponents}
                        styles={selectStyles}
                        placeholder="Todos os Anos"
                        closeMenuOnSelect={false}
                    />
                </div>

                {/* Country Filter (Multi Select) */}
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-dark-text-secondary mb-1">Países</label>
                    <Select
                        isMulti
                        options={countryOptions}
                        value={getSelectedOptions(countryOptions, selectedCountryIds)}
                        onChange={(selectedOptions) => {
                            onCountryChange(selectedOptions.map(opt => opt.value));
                            if (typeof document !== 'undefined') {
                                document.dispatchEvent(new CustomEvent('tour:filter-change', {
                                    detail: {
                                        stepId: 'heatmap-filters',
                                        filter: 'countries',
                                        filled: Boolean(selectedOptions?.length),
                                    },
                                }));
                            }
                        }}
                        onMenuOpen={markMenuOpen('countries')}
                        onMenuClose={markMenuClose('countries')}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        classNamePrefix="cf-select"
                        components={selectComponents}
                        styles={selectStyles}
                        placeholder="Todos os Países"
                        closeMenuOnSelect={false}
                    />
                </div>

                {/* Project Filter (Multi Select) */}
                <div className="flex-1 min-w-[240px]">
                    <label className="block text-sm font-medium text-dark-text-secondary mb-1">Projetos</label>
                     <AsyncPaginate
                        isMulti
                        value={selectedProjectObjects}
                        loadOptions={loadProjectOptions}
                        onChange={handleProjectChange}
                        onMenuOpen={markMenuOpen('projects')}
                        onMenuClose={markMenuClose('projects')}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        classNamePrefix="cf-select"
                        components={selectComponents}
                        styles={selectStyles}
                        placeholder="Todos os Projetos"
                        closeMenuOnSelect={false}
                        debounceTimeout={300}
                        additional={{ page: 0, filters: {} }}
                        loadingMessage={() => 'Carregando mais projetos...'}
                     />
                </div>

                {/* Objective Filter (Single Select) */}
                <div className="flex-1 min-w-[170px]">
                    <label className="block text-sm font-medium text-dark-text-secondary mb-1">Objetivo</label>
                    <Select
                        options={filteredObjectiveOptions}
                        value={getSelectedOption(filteredObjectiveOptions, selectedObjective)}
                        onChange={(selectedOption) => {
                            onObjectiveChange(selectedOption ? selectedOption.value : 'all');
                            if (typeof document !== 'undefined') {
                                document.dispatchEvent(new CustomEvent('tour:filter-change', {
                                    detail: {
                                        stepId: 'heatmap-filters',
                                        filter: 'objective',
                                        filled: Boolean(selectedOption),
                                    },
                                }));
                            }
                        }}
                        onMenuOpen={markMenuOpen('objective')}
                        onMenuClose={markMenuClose('objective')}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        classNamePrefix="cf-select"
                        components={selectComponents}
                        styles={selectStyles}
                        placeholder="Todos Objetivos"
                    />
                </div>
            </div>

            {/* View Filter (Single Select) */}
            <div className="flex w-full">
                <div className="flex-1 min-w-[230px]">
                    <label className="block text-sm font-medium text-dark-text-secondary mb-1">Visualização</label>
                    <Select
                        options={viewOptions}
                        value={getSelectedOption(viewOptions, selectedView)}
                        onChange={(selectedOption) => {
                            onViewChange(selectedOption ? selectedOption.value : 'country_year');
                            if (typeof document !== 'undefined') {
                                document.dispatchEvent(new CustomEvent('tour:filter-change', {
                                    detail: {
                                        stepId: 'heatmap-filters',
                                        filter: 'view',
                                        filled: Boolean(selectedOption),
                                    },
                                }));
                            }
                        }}
                        onMenuOpen={markMenuOpen('view')}
                        onMenuClose={markMenuClose('view')}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                        classNamePrefix="cf-select"
                        components={selectComponents}
                        styles={viewSelectStyles}
                        placeholder="Selecionar Visão"
                    />
                </div>
            </div>
        </div>
    );
};

export default HeatmapFilters;
