import React, { useState, useEffect } from 'react';
import { getFundTypes, getFundFocuses, getFundsData } from './services/api'; 
import BubbleChartPage from './components/fund_sizes/BubbleChartPage'; 
import BarChartPage from './components/status_of_funds/BarChartPage'; 
import Tabs from './components/Tabs';
import './styles.css'; // Certifique-se que este arquivo existe e tem estilos básicos ou TailwindCSS @tailwind directives
import DataGridPage from './components/fund_data_table/DataGridPage';

function App() {
  const [activeTab, setActiveTab] = useState('status'); // 'status' ou 'size'
  const [fundTypes, setFundTypes] = useState([]);
  const [fundFocuses, setFundFocuses] = useState([]);
  const [fundIds, setFundIds] = useState([]);
  const [initialDataLoading, setInitialDataLoading] = useState(true);
  const [error, setError] = useState(null);

  // Abas disponíveis
 const TABS = [
    { id: 'status', label: 'Status of the Funds' },
    { id: 'size', label: 'Fund Sizes' },
    { id: 'data-table', label: 'Table of funds' },
  ]; 

  // Carrega dados iniciais (tipos, focos e fundos) que podem ser usados por ambas as abas/filtros
  useEffect(() => {
    const fetchInitialFilterData = async () => {
      setInitialDataLoading(true);
      setError(null);
      try {
        const types = await getFundTypes();
        const focuses = await getFundFocuses();
        const funds = await getFundsData();
        setFundTypes(types || []);
        setFundFocuses(focuses || []);
        setFundIds(funds || []);
      } catch (err) {
        console.error('Error fetching initial filter data:', err);
        setError('Falha ao carregar dados de filtro. Tente recarregar a página.');
        setFundTypes([]);
        setFundFocuses([]);
        setFundIds([]);
      } finally {
        setInitialDataLoading(false);
      }
    };
    fetchInitialFilterData();
  }, []);

  if (initialDataLoading) {
    return <div className="flex justify-center items-center h-screen text-xl">Carregando dados iniciais...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500 text-xl p-4 text-center">{error}</div>;
  }

  return (
    <div className="app min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
      <header className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800">Climate Funds Panel</h1>
      </header>

      <Tabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="mt-6">
        {activeTab === 'status' && (
          <BarChartPage
            allFundTypes={fundTypes}
            allFundFocuses={fundFocuses}
            allFunds={fundIds}
          />
        )}
        {activeTab === 'size' && (
          <BubbleChartPage
            allFundTypes={fundTypes}
            allFundFocuses={fundFocuses}
          />
        )}
        {activeTab === 'data-table' && <DataGridPage />}
      </main>
    </div>
  );
}

export default App;