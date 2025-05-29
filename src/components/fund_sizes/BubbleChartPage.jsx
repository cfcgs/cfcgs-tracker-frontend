import React, { useState, useEffect } from 'react';
import { getFundsData } from '../../services/api';
import BubbleChart from './BubbleChart'; // Seu componente BubbleChart existente
import Filters from './BubbleChartFilters'; // Seu componente Filters existente

const BubbleChartPage = ({ allFundTypes, allFundFocuses }) => {
  const [fundsData, setFundsData] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedFocuses, setSelectedFocuses] = useState([]);
  const [loading, setLoading] = useState(false); // Inicia como false, pois os filtros são carregados primeiro
  const [error, setError] = useState(null);

  // Inicializa filtros selecionados quando os tipos e focos disponíveis são carregados
  useEffect(() => {
    if (allFundTypes.length > 0) {
      setSelectedTypes(allFundTypes.map(type => type.id));
    } else {
      setSelectedTypes([]);
    }
    if (allFundFocuses.length > 0) {
      setSelectedFocuses(allFundFocuses.map(focus => focus.id));
    } else {
      setSelectedFocuses([]);
    }
  }, [allFundTypes, allFundFocuses]);

  // Carrega dados dos fundos quando os filtros mudam
  useEffect(() => {
    // Apenas busca se houver filtros selecionados e os dados base (tipos/focos) já estiverem carregados
    if ((selectedTypes.length > 0 || selectedFocuses.length > 0) && allFundTypes.length > 0 && allFundFocuses.length > 0) {
      const fetchBubbleData = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getFundsData({ // getFundsData é a API para o BubbleChart
            selectedTypes,
            selectedFocuses
          });
          setFundsData(data || []);
        } catch (err) {
          console.error('Error fetching funds data for bubble chart:', err);
          setError('Falha ao carregar dados do gráfico de bolhas.');
          setFundsData([]);
        } finally {
          setLoading(false);
        }
      };
      fetchBubbleData();
    } else if (allFundTypes.length > 0 || allFundFocuses.length > 0) {
      // Se os tipos/focos estão carregados mas nenhum filtro selecionado, limpa os dados
      setFundsData([]);
      setLoading(false);
    }
  }, [selectedTypes, selectedFocuses, allFundTypes, allFundFocuses]);

  const handleTypeChange = (typeId) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleFocusChange = (focusId) => {
    setSelectedFocuses(prev =>
      prev.includes(focusId)
        ? prev.filter(id => id !== focusId)
        : [...prev, focusId]
    );
  };

  return (
    <div className="dashboard-container bg-white p-4 md:p-6 rounded-lg shadow-lg">
      <Filters
        fundTypes={allFundTypes}
        fundFocuses={allFundFocuses}
        selectedTypes={selectedTypes}
        selectedFocuses={selectedFocuses}
        onTypeChange={handleTypeChange}
        onFocusChange={handleFocusChange}
      />
      <div className="chart-area mt-6 min-h-[400px]">
        {loading && <div className="loading text-center p-10">Carregando dados do gráfico de bolhas...</div>}
        {!loading && error && <div className="error text-center text-red-500 p-10">{error}</div>}
        {!loading && !error && fundsData.length === 0 && (selectedTypes.length > 0 || selectedFocuses.length > 0) && (
          <div className="text-center p-10 text-gray-500">Nenhum dado encontrado para os filtros selecionados.</div>
        )}
        {!loading && !error && fundsData.length === 0 && selectedTypes.length === 0 && selectedFocuses.length === 0 && allFundTypes.length > 0 && (
          <div className="text-center p-10 text-gray-500">Selecione ao menos um filtro para exibir os dados.</div>
        )}
        {!loading && !error && fundsData.length > 0 && <BubbleChart fundsData={fundsData} />}
      </div>
    </div>
  );
};

export default BubbleChartPage;