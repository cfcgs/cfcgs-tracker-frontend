// src/App.jsx
import React, { useState } from 'react';
import './index.css';

import SideNav from './components/SideNav';
import DashboardPage from './pages/DashboardPage';
import DataGridPage from './pages/DataGridPage'; // Importa a nova página de tabelas

// Simula outras páginas para o menu
const ReportsPage = () => <div className="p-6 text-white text-3xl">Página de Relatórios (em construção)</div>;
const FundsPage = () => <div className="p-6 text-white text-3xl">Página de Fundos (em construção)</div>;
const UploadPage = () => <div className="p-6 text-white text-3xl">Página de Upload (em construção)</div>;

function App() {
    const [activeView, setActiveView] = useState('dashboard');

    const renderActiveView = () => {
        switch (activeView) {
            case 'dashboard':
                return <DashboardPage />;
            case 'datagrid':
                return <DataGridPage />;
            case 'reports':
                return <ReportsPage />;
            case 'funds':
                 return <FundsPage />;
            case 'upload':
                return <UploadPage />;
            default:
                return <DashboardPage />;
        }
    };

    return (
        <div className="flex min-h-screen bg-dark-bg text-dark-text">
            <SideNav activeView={activeView} onNavChange={setActiveView} />
            <main className="flex-1 overflow-y-auto">
                {renderActiveView()}
            </main>
        </div>
    );
}

export default App;