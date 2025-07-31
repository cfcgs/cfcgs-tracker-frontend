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

const BubbleChartFilters = ({
  fundTypes,
  fundFocuses,
  selectedTypes,
  selectedFocuses,
  onTypeChange,
  onFocusChange
}) => {
  // Transforma os dados para o formato que o react-select espera: { value, label }
  const typeOptions = fundTypes.map(type => ({ value: type.id, label: type.name }));
  const focusOptions = fundFocuses.map(focus => ({ value: focus.id, label: focus.name }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-dark-text-secondary mb-1">Tipos de Fundo</label>
        <Select
            isMulti
            options={typeOptions}
            value={typeOptions.filter(opt => selectedTypes.includes(opt.value))}
            onChange={onTypeChange}
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
            onChange={onFocusChange}
            styles={selectStyles}
            placeholder="Todos os Focos"
        />
      </div>
    </div>
  );
};

export default BubbleChartFilters;