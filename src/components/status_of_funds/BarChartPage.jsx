import React, { useState, useEffect, useCallback } from 'react';
import { getFundStatusData } from '../../services/api';
import BarChart from './BarChart';
import BarChartFilters from './BarChartFilters';

const BarChartPage = ({ allFundTypes, allFundFocuses, allFunds }) => {
    const [statusData, setStatusData] = useState(null);
    const [selectedFundIds, setSelectedFundIds] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedFocuses, setSelectedFocuses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Define seleções iniciais para os filtros de status
        setSelectedTypes(allFundTypes.map(t => t.id));
        setSelectedFocuses(allFundFocuses.map(f => f.id));
        setSelectedFundIds(allFunds.map(f => f.id))
    }, [allFundTypes, allFundFocuses, allFunds]);


    const fetchStatusData = useCallback(async () => {
        // Apenas busca se os filtros base (tipos/focos/funds) estiverem disponíveis
        if (allFundTypes.length === 0
            && allFundFocuses.length === 0
            && allFunds.length === 0
            && (selectedTypes.length > 0
                || selectedFocuses.length > 0
                || selectedFundIds.length > 0)) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const filtersPayload = {
                funds: selectedFundIds.length > 0 ? selectedFundIds : [],
                fund_types: selectedTypes.length > 0 ? selectedTypes : [],
                fund_focuses: selectedFocuses.length > 0 ? selectedFocuses : [],
            };
            const data = await getFundStatusData(filtersPayload);
            setStatusData(data);
        } catch (err) {
            console.error('Error fetching fund status data:', err);
            setError('Falha ao carregar dados de status dos fundos.');
            setStatusData(null);
        } finally {
            setLoading(false);
        }
    }, [selectedTypes, selectedFocuses, selectedFundIds, allFundTypes, allFundFocuses, allFunds]); // Adicionado allFundTypes e allFundFocuses

    useEffect(() => {
        // Busca dados quando os filtros selecionados mudam, e os dados base de filtros estão carregados
        if ((allFundTypes.length > 0 || allFundFocuses.length > 0) || allFunds > 0) {
            fetchStatusData();
        } else if (selectedTypes.length === 0 && selectedFocuses.length === 0 && (allFundTypes.length > 0 || allFundFocuses.length > 0)) {
            // Se os filtros foram limpos e os dados base estão lá, busca (API deve tratar filtros vazios como "todos")
            // ou limpa os dados se a API não suportar isso.
            // fetchStatusData(); // Ou setStatusData(null);
        }
    }, [fetchStatusData, allFundTypes, allFundFocuses, allFunds, selectedFundIds, selectedTypes, selectedFocuses]);


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

    const handleFundChange = (fundId) => { 
        setSelectedFundIds( prev =>
            prev.includes(fundId)
                ? prev.filter(id => id !== fundId)
                : [...prev, fundId]
        )
     }

    return (
        <div className="dashboard-container bg-white p-4 md:p-6 rounded-lg shadow-lg">
            <BarChartFilters
                allFundTypes={allFundTypes}
                allFundFocuses={allFundFocuses}
                allFunds={allFunds}
                selectedFundIds={selectedFundIds}
                selectedTypes={selectedTypes}
                selectedFocuses={selectedFocuses}
                onTypeChange={handleTypeChange}
                onFocusChange={handleFocusChange}
                onFundChange={handleFundChange}
            // Passe props para o filtro de fundos individuais se implementado
            />
            <div className="chart-area mt-6 min-h-[400px]">
                {loading && <div className="loading text-center p-10">Carregando dados do gráfico de status...</div>}
                {!loading && error && <div className="error text-center text-red-500 p-10">{error}</div>}
                {!loading && !error && !statusData && (selectedTypes.length > 0 || selectedFocuses.length > 0) && (
                    <div className="text-center p-10 text-gray-500">Nenhum dado de status encontrado para os filtros.</div>
                )}
                {!loading && !error && !statusData && selectedTypes.length === 0 && selectedFocuses.length === 0 && selectedFundIds === 0 && (allFundTypes.length > 0 || allFundFocuses.length > 0 || allFunds.length > 0) && (
                    <div className="text-center p-10 text-gray-500">Selecione filtros para ver o status dos fundos.</div>
                )}
                {!loading && !error && statusData && <BarChart statusData={statusData} />}
            </div>
        </div>
    );
};

export default BarChartPage;