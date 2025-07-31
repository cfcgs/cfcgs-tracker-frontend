import React, { useState, useEffect, useMemo } from 'react';
import Highcharts from 'highcharts';
import { 
    getCommitmentsData, 
    getFundsData, 
    getFundTypes, 
    getFundFocuses, 
    getFundStatusData, 
    getRecipientCountries,
    getTotalsByObjective
} from '../services/api';
import { darkTheme } from '../highcharts-theme';

// Importe todos os seus componentes
import LineChart from '../components/dashboard/CommitmentsLineChart';
import Filters from '../components/dashboard/CommitmentsFilters';
import BarChart from '../components/dashboard/BarChart';
import BarChartFilters from '../components/dashboard/BarChartFilters';
import BubbleChart from '../components/dashboard/BubbleChart';
import BubbleChartFilters from '../components/dashboard/BubbleChartFilters';
import ObjectiveLineChart from '../components/dashboard/ObjectiveLineChart';
import ObjectiveFilters from '../components/dashboard/ObjectiveFilters';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ChartCard = ({ title, children }) => (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex flex-col h-full">
        <h3 className="text-xl font-semibold text-dark-text mb-4">{title}</h3>
        <div className="flex-grow">{children}</div>
    </div>
);

const DashboardPage = () => {
    // Estados para dados brutos da API (usados para popular opções de filtros)
    const [commitments, setCommitments] = useState([]);
    const [allFunds, setAllFunds] = useState([]);
    const [fundTypes, setFundTypes] = useState([]);
    const [fundFocuses, setFundFocuses] = useState([]);
    const [allRecipientCountries, setAllRecipientCountries] = useState([]);
    
    // Estados para opções de filtro
    const [availableYears, setAvailableYears] = useState([]);

    // Estados para filtros selecionados
    const [selectedYears, setSelectedYears] = useState([]);
    const [selectedRecipientCountries, setSelectedRecipientCountries] = useState([]);
    const [bubbleSelectedTypes, setBubbleSelectedTypes] = useState([]);
    const [bubbleSelectedFocuses, setBubbleSelectedFocuses] = useState([]);
    const [barSelectedTypes, setBarSelectedTypes] = useState([]);
    const [barSelectedFocuses, setBarSelectedFocuses] = useState([]);
    const [barSelectedFunds, setBarSelectedFunds] = useState([]);
    const [objectiveSelectedYears, setObjectiveSelectedYears] = useState([]);
    const [objectiveSelectedCountries, setObjectiveSelectedCountries] = useState([]);
    const [objectiveSelectedObjectives, setObjectiveSelectedObjectives] = useState(['Adaptação', 'Mitigação']);

    // Estados para dados processados
    const [bubbleChartData, setBubbleChartData] = useState([]);
    const [barChartData, setBarChartData] = useState(null);
    const [objectiveTotals, setObjectiveTotals] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Efeito para buscar todos os dados iniciais
    useEffect(() => {
        Highcharts.setOptions(darkTheme);
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const [commitmentsData, fundsData, typesData, focusesData, recipientCountriesData] = await Promise.all([
                    getCommitmentsData(), getFundsData(), getFundTypes(), getFundFocuses(), getRecipientCountries()
                ]);

                const safeCommitments = commitmentsData || [];
                setCommitments(safeCommitments);
                setAllFunds(fundsData || []);
                setFundTypes(typesData || []);
                setFundFocuses(focusesData || []);
                setAllRecipientCountries(recipientCountriesData || []);
                setBubbleChartData(fundsData || []);

                const years = [...new Set(safeCommitments.map(c => c.year))].sort((a, b) => b - a);
                setAvailableYears(years);

            } catch (err) {
                setError('Falha ao carregar os dados do dashboard.');
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    // Memoiza dados para o Gráfico de Linhas (Evolução por País Receptor)
    const lineChartSeries = useMemo(() => {
        if (!commitments.length) return [];
        const yearsToFilter = selectedYears.length > 0 ? selectedYears : availableYears;
        const filteredByYear = commitments.filter(c => yearsToFilter.includes(c.year));
        const totalByYear = filteredByYear.reduce((acc, curr) => {
            acc[curr.year] = (acc[curr.year] || 0) + curr.amount_usd_thousand;
            return acc;
        }, {});
        const totalSeries = {
            name: 'Financiamento Total Agregado',
            data: yearsToFilter.map(year => [year, Math.round(totalByYear[year] || 0)]).sort((a,b) => a[0] - b[0]),
            zIndex: 1, marker: { lineWidth: 2, lineColor: Highcharts.getOptions().colors[0], fillColor: 'white' }
        };
        const countrySeries = selectedRecipientCountries.map(countryName => {
            const dataByYear = filteredByYear.filter(c => c.recipient_country === countryName).reduce((acc, curr) => {
                acc[curr.year] = (acc[curr.year] || 0) + curr.amount_usd_thousand;
                return acc;
            }, {});
            return {
                name: countryName,
                data: yearsToFilter.map(year => [year, Math.round(dataByYear[year] || 0)]).sort((a,b) => a[0] - b[0])
            };
        });
        return [totalSeries, ...countrySeries];
    }, [commitments, selectedYears, selectedRecipientCountries, availableYears]);
    
    // useEffect para buscar dados do BubbleChart
    useEffect(() => {
        if (loading) return;
        const fetchBubbleData = async () => {
            const filters = {
                selectedTypes: bubbleSelectedTypes,
                selectedFocuses: bubbleSelectedFocuses
            };
            try {
                const data = await getFundsData(filters);
                setBubbleChartData(data);
            } catch (error) { setBubbleChartData([]); }
        };
        fetchBubbleData();
    }, [loading, bubbleSelectedTypes, bubbleSelectedFocuses]);

    // useEffect para buscar dados do BarChart
    useEffect(() => {
        if (loading) return;
        const fetchBarData = async () => {
            const filters = {
                selectedFunds: barSelectedFunds,
                selectedTypes: barSelectedTypes,
                selectedFocuses: barSelectedFocuses
            };
            try {
                const data = await getFundStatusData(filters);
                setBarChartData(data);
            } catch (error) { setBarChartData(null); }
        };
        fetchBarData();
    }, [loading, barSelectedFunds, barSelectedTypes, barSelectedFocuses]);

    // useEffect para buscar dados do Gráfico de Objetivos
    useEffect(() => {
        if (loading) return;
        const fetchObjectiveData = async () => {
            const filters = {
                selectedYears: objectiveSelectedYears,
                selectedCountryIds: objectiveSelectedCountries // O backend espera IDs
            };
            try {
                const data = await getTotalsByObjective(filters);
                setObjectiveTotals(data);
            } catch (error) { setObjectiveTotals([]); }
        };
        fetchObjectiveData();
    }, [loading, objectiveSelectedYears, objectiveSelectedCountries]);

    // useMemo para formatar os dados para o Gráfico de Objetivos
    const objectiveChartSeries = useMemo(() => {
        if (!objectiveTotals.length) return [];
        const series = [];
        if (objectiveSelectedObjectives.includes('Adaptação')) {
            series.push({
                name: 'Adaptação',
                data: objectiveTotals.map(d => [d.year, d.total_adaptation]).sort((a,b) => a[0] - b[0])
            });
        }
        if (objectiveSelectedObjectives.includes('Mitigação')) {
            series.push({
                name: 'Mitigação',
                data: objectiveTotals.map(d => [d.year, d.total_mitigation]).sort((a,b) => a[0] - b[0])
            });
        }
        return series;
    }, [objectiveTotals, objectiveSelectedObjectives]);

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="flex justify-center items-center h-full text-red-500">{error}</div>;

    return (
        <div className="p-4 md:p-6 space-y-6">
            <h2 className="text-3xl font-bold mb-6 text-dark-text">Visão Geral do Financiamento Climático</h2>
            
            <ChartCard title="Evolução do Financiamento por País Receptor">
                 <Filters
                    years={availableYears}
                    countries={allRecipientCountries.map(c => c.name)}
                    selectedYears={selectedYears}
                    selectedCountries={selectedRecipientCountries}
                    onYearChange={setSelectedYears}
                    onCountryChange={setSelectedRecipientCountries}
                />
                <LineChart seriesData={lineChartSeries} title="" />
            </ChartCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Análise de Fundos por Tamanho">
                    <BubbleChartFilters
                        fundTypes={fundTypes}
                        fundFocuses={fundFocuses}
                        selectedTypes={bubbleSelectedTypes}
                        selectedFocuses={bubbleSelectedFocuses}
                        onTypeChange={(options) => setBubbleSelectedTypes(options ? options.map(o => o.value) : [])}
                        onFocusChange={(options) => setBubbleSelectedFocuses(options ? options.map(o => o.value) : [])}
                    />
                    <div className="mt-4">
                      <BubbleChart fundsData={bubbleChartData} />
                    </div>
                </ChartCard>

                <ChartCard title="Status Financeiro Agregado">
                     <BarChartFilters
                        allFunds={allFunds}
                        allFundTypes={fundTypes}
                        allFundFocuses={fundFocuses}
                        selectedFundIds={barSelectedFunds}
                        selectedTypes={barSelectedTypes}
                        selectedFocuses={barSelectedFocuses}
                        onFundChange={(options) => setBarSelectedFunds(options ? options.map(o => o.value) : [])}
                        onTypeChange={(options) => setBarSelectedTypes(options ? options.map(o => o.value) : [])}
                        onFocusChange={(options) => setBarSelectedFocuses(options ? options.map(o => o.value) : [])}
                    />
                     <div className="mt-4">
                        <BarChart statusData={barChartData} />
                     </div>
                </ChartCard>
            </div>
            
            <ChartCard title="Financiamento por Objetivo Climático">
                <ObjectiveFilters
                    years={availableYears}
                    countries={allRecipientCountries}
                    objectives={['Adaptação', 'Mitigação']}
                    selectedYears={objectiveSelectedYears}
                    selectedCountries={objectiveSelectedCountries}
                    selectedObjectives={objectiveSelectedObjectives}
                    onYearChange={setObjectiveSelectedYears}
                    onCountryChange={setObjectiveSelectedCountries}
                    onObjectiveChange={setObjectiveSelectedObjectives}
                />
                <div className="mt-4">
                    <ObjectiveLineChart seriesData={objectiveChartSeries} />
                </div>
            </ChartCard>
        </div>
    );
};

export default DashboardPage;