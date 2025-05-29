import React from 'react';

const Tabs = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className="tabs-navigation-container">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default Tabs;