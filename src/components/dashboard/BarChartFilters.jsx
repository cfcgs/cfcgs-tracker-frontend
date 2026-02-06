import React, { useRef } from 'react';
import Select from 'react-select';

// Reutiliza os mesmos estilos
const CONTROL_HEIGHT = 44;
const selectStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: '#0D1117',
    borderColor: '#30363D',
    color: '#C9D1D9',
    minWidth: '200px',
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
  multiValue: (provided) => ({ ...provided, backgroundColor: '#30363D', margin: '2px 4px 2px 0' }),
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
  input: (provided) => ({ ...provided, color: '#C9D1D9' }),
  placeholder: (provided) => ({ ...provided, color: '#8B949E' })
};

const BarChartFilters = ({
    allFunds,
    allFundTypes,
    allFundFocuses,
    selectedTypes,
    selectedFocuses,
    selectedFundIds,
    onTypeChange,
    onFocusChange,
    onFundChange
}) => {
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
                    stepId: 'status-filters',
                    filter: key,
                    filled: true,
                },
            }));
        }
    };
    const fundOptions = allFunds.map(fund => ({ value: fund.id, label: fund.fund_name }));
    const typeOptions = allFundTypes.map(type => ({ value: type.id, label: type.name }));
    const focusOptions = allFundFocuses.map(focus => ({ value: focus.id, label: focus.name }));

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4" data-tour="status-filters">
             <div className="flex-1">
                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Fundos</label>
                <Select
                    isMulti
                    options={fundOptions}
                    value={fundOptions.filter(opt => selectedFundIds.includes(opt.value))}
                    onChange={(selected) => {
                        onFundChange(selected);
                        if (typeof document !== 'undefined') {
                            document.dispatchEvent(new CustomEvent('tour:filter-change', {
                                detail: {
                                    stepId: 'status-filters',
                                    filter: 'funds',
                                    filled: Boolean(selected?.length),
                                },
                            }));
                        }
                    }}
                    onMenuOpen={markMenuOpen('funds')}
                    onMenuClose={markMenuClose('funds')}
                    classNamePrefix="cf-select"
                    styles={selectStyles}
                    placeholder="Todos os Fundos"
                />
            </div>
            <div className="flex-1">
                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Tipos de Fundo</label>
                <Select
                    isMulti
                    options={typeOptions}
                    value={typeOptions.filter(opt => selectedTypes.includes(opt.value))}
                    onChange={(selected) => {
                        onTypeChange(selected);
                        if (typeof document !== 'undefined') {
                            document.dispatchEvent(new CustomEvent('tour:filter-change', {
                                detail: {
                                    stepId: 'status-filters',
                                    filter: 'types',
                                    filled: Boolean(selected?.length),
                                },
                            }));
                        }
                    }}
                    onMenuOpen={markMenuOpen('types')}
                    onMenuClose={markMenuClose('types')}
                    classNamePrefix="cf-select"
                    styles={selectStyles}
                    placeholder="Todos os Tipos"
                />
            </div>
            <div className="flex-1">
                <label className="block text-sm font-medium text-dark-text-secondary mb-1">Focos do Fundo</label>
                <Select
                    isMulti
                    options={focusOptions}
                    value={focusOptions.filter(opt => selectedFocuses.includes(opt.value))}
                    onChange={(selected) => {
                        onFocusChange(selected);
                        if (typeof document !== 'undefined') {
                            document.dispatchEvent(new CustomEvent('tour:filter-change', {
                                detail: {
                                    stepId: 'status-filters',
                                    filter: 'focuses',
                                    filled: Boolean(selected?.length),
                                },
                            }));
                        }
                    }}
                    onMenuOpen={markMenuOpen('focuses')}
                    onMenuClose={markMenuClose('focuses')}
                    classNamePrefix="cf-select"
                    styles={selectStyles}
                    placeholder="Todos os Focos"
                />
            </div>
        </div>
    );
};

export default BarChartFilters;
