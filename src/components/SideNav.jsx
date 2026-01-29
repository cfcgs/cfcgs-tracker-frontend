import React from 'react';
import { FiGrid, FiBarChart2, FiCircle, FiTable, FiUpload, FiMessageSquare } from 'react-icons/fi';

const SideNav = ({ activeView, onNavChange, footer }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <FiGrid />, tour: 'nav-dashboard' },
        { id: 'datagrid', label: 'Tabelas Completas', icon: <FiTable />, tour: 'nav-datagrid' },
        // { id: 'reports', label: 'Relatórios', icon: <FiBarChart2 /> },
        // { id: 'funds', label: 'Fundos', icon: <FiCircle /> },
        { id: 'chatbot', label: 'Assistente IA', icon: <FiMessageSquare />, tour: 'nav-chatbot' },
        // { id: 'upload', label: 'Upload de Dados', icon: <FiUpload /> },
    ];

    return (
        <nav className="w-64 h-screen sticky top-0 bg-dark-card border-r border-dark-border p-4 flex flex-col">
            <div className="text-2xl font-bold text-white mb-10">
                CFC-GS <span className="text-accent-blue">Tracker</span>
            </div>
            <ul className="flex flex-col space-y-2">
                {navItems.map(item => (
                    <li key={item.id}>
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); onNavChange(item.id); }}
                            className={`flex items-center p-3 rounded-lg transition-colors
                                ${activeView === item.id 
                                    ? 'bg-accent-blue text-white' 
                                    : 'text-dark-text-secondary hover:bg-gray-700 hover:text-white'}`
                            }
                            data-tour={item.tour}
                        >
                            <span className="mr-3 text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                        </a>
                    </li>
                ))}
            </ul>
            {footer && <div className="mt-auto pt-6">{footer}</div>}
        </nav>
    );
};

export default SideNav;
