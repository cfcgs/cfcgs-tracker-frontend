import React from 'react';

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
    // Função auxiliar para renderizar checkboxes
    const renderCheckboxGroup = (title, items, selectedItems, onChange) => (
        <div className="filter-container">
            <h3>{title}</h3>
            <div className="filter-group">
                    {items.length === 0 && <span className="text-xs text-gray-500 col-span-full">Nenhuma opção disponível.</span>}
                    {items.map(item => (
                        <div className="filter-item" key={item.id} >
                            <input
                                type="checkbox"
                                id={title=="Fund Types" 
                                    ? `type-${item.id}`
                                    : title=="Fund Focuses"
                                        ? `focus-${item.id}`
                                        : `fund-${item.id}`
                                }
                                checked={selectedItems.includes(item.id)}
                                onChange={() => onChange(item.id)}
                            />
                            <label 
                                htmlFor={title=="Fund Types" 
                                    ? `type-${item.id}`
                                    : title=="Fund Focuses"
                                        ? `focus-${item.id}`
                                        : `fund-${item.id}`
                                }
                            >
                                {item.name ?? item.fund_name}
                            </label>
                        </div>
                    ))}
                </div>
        </div>
    );

    return (
        <div className="filters-container p-4 border border-gray-300 rounded-lg shadow bg-white">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Status Filters</h2>
            {renderCheckboxGroup("Fund Types", allFundTypes, selectedTypes, onTypeChange)}
            {renderCheckboxGroup("Fund Focuses", allFundFocuses, selectedFocuses, onFocusChange)}
            {renderCheckboxGroup("Funds", allFunds || [], selectedFundIds, onFundChange)}
        </div>
    );
};

export default BarChartFilters;
