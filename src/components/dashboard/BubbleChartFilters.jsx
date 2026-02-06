import React, { useRef } from 'react';
import Select from 'react-select';

// Estilos customizados para o react-select (pode ser movido para um arquivo separado)
const CONTROL_HEIGHT = 44;
const selectStyles = {
  container: (provided) => ({
    ...provided,
    width: '100%',
    maxWidth: '100%',
  }),
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

const BubbleChartFilters = ({
  fundTypes,
  fundFocuses,
  selectedTypes,
  selectedFocuses,
  onTypeChange,
  onFocusChange
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
          stepId: 'bubble-filters',
          filter: key,
          filled: true,
        },
      }));
    }
  };
  // Transforma os dados para o formato que o react-select espera: { value, label }
  const typeOptions = fundTypes.map(type => ({ value: type.id, label: type.name }));
  const focusOptions = fundFocuses.map(focus => ({ value: focus.id, label: focus.name }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4" data-tour="bubble-filters">
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
                    stepId: 'bubble-filters',
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
                    stepId: 'bubble-filters',
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

export default BubbleChartFilters;
