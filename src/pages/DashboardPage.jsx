// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Highcharts from 'highcharts';

// --- APLICAÇÃO DO TEMA ---
import { darkTheme } from '../highcharts-theme';
if (darkTheme) {
    Highcharts.setOptions(darkTheme);
} else {
    console.warn("Highcharts dark theme not loaded! Applying basic fallback.");
    Highcharts.setOptions({
        chart: { backgroundColor: '#161B22' }, title: { style: { color: '#C9D1D9' } },
        subtitle: { style: { color: '#8B949E' } }, xAxis: { gridLineColor: '#30363D', lineColor: '#30363D', labels: { style: { color: '#8B949E' } }, title: { style: { color: '#C9D1D9' } } },
        yAxis: { gridLineColor: '#30363D', lineColor: '#30363D', labels: { style: { color: '#8B949E' } }, title: { style: { color: '#C9D1D9' } } },
        legend: { itemStyle: { color: '#C9D1D9' }, itemHoverStyle: { color: '#FFFFFF' } },
        tooltip: { backgroundColor: 'rgba(30, 30, 30, 0.9)', style: { color: '#E0E0E0' } },
        credits: { enabled: false }
    });
}
// -------------------------

// Importe as funções da API (antigas e novas)
import {
    getFundsData, getFundTypes, getFundFocuses, getFundStatusData,
    getRecipientCountries, getTotalsByObjective,
    getCommitmentTimeSeries, getAvailableYears,
    // --- Novas funções ---
    getKpisData,
} from '../services/api';

// Importe TODOS os componentes
import HeatmapFilters from '../components/dashboard/HeatmapFilters';
import HeatmapChart from '../components/dashboard/HeatmapChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import LineChart from '../components/dashboard/CommitmentsLineChart';
import Filters from '../components/dashboard/CommitmentsFilters';
import BarChart from '../components/dashboard/BarChart';
import BarChartFilters from '../components/dashboard/BarChartFilters';
import BubbleChart from '../components/dashboard/BubbleChart';
import BubbleChartFilters from '../components/dashboard/BubbleChartFilters';
import ObjectiveLineChart from '../components/dashboard/ObjectiveLineChart';
import ObjectiveFilters from '../components/dashboard/ObjectiveFilters';

// [NOVO] Importar mais ícones para os KPIs financeiros
import { FiBox, FiGlobe, FiDollarSign, FiArrowDownCircle, FiCheckSquare } from 'react-icons/fi';

// --- [CORREÇÃO] ChartCard atualizado para suportar layout flexível ---
const ChartCard = ({
    title,
    children,
    className = "",
    sources = [],
    sourceClassName = "mt-2",
}) => (
    // Adicionado overflow-hidden para garantir que o conteúdo não vaze
    <div className={`relative bg-dark-card border border-dark-border rounded-xl p-4 pb-4 flex flex-col h-full min-h-0 overflow-hidden ${className}`}>
        {title && <h3 className="text-xl font-semibold text-dark-text mb-4">{title}</h3>}
        {/* flex-grow e min-h-0 permitem que o conteúdo interno use o espaço */}
        <div className="relative z-0 flex-grow flex flex-col min-h-0">{children}</div>
        {sources.length > 0 && (
            <div className={`relative z-10 text-[11px] text-dark-text-secondary flex-shrink-0 ${sourceClassName}`}>
                Fonte:{' '}
                {sources.map((source, index) => (
                    <React.Fragment key={`${source.url}-${index}`}>
                        {index > 0 && ' · '}
                        <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent-blue hover:underline"
                        >
                            {source.label}
                        </a>
                    </React.Fragment>
                ))}
            </div>
        )}
    </div>
);

const DATA_SOURCES = {
    cfu: {
        label: 'Climate Funds Update (CFU)',
        url: 'https://climatefundsupdate.org/data-dashboard/',
    },
    oecd: {
        label: 'OECD (Organisation for Economic Co-operation and Development)',
        url: 'https://www.oecd.org/en.html',
    },
};

const DashboardPage = () => {
    // --- Estados para dados de opções dos filtros (do _old) ---
    const [allFunds, setAllFunds] = useState([]);
    const [fundTypes, setFundTypes] = useState([]);
    const [fundFocuses, setFundFocuses] = useState([]);
    const [allRecipientCountries, setAllRecipientCountries] = useState([]);
    const [availableYears, setAvailableYears] = useState([]);
    const [loadingFilters, setLoadingFilters] = useState(true); // Renomeado de 'loading'
    const [globalError, setGlobalError] = useState(null); // Renomeado de 'error'

    // --- Estados para KPIs (NOVO) ---
    const [kpis, setKpis] = useState({ total_projects: 0, total_funded_countries: 0 });
    const [kpisLoading, setKpisLoading] = useState(true);
    // [NOVO] Estado para os KPIs financeiros TOTAIS (separado do gráfico de barras)
    const [totalFinancialKpis, setTotalFinancialKpis] = useState({ total_pledge: 0, total_deposit: 0, total_approval: 0 });
    const [totalKpisLoading, setTotalKpisLoading] = useState(true); // Loading para os KPIs financeiros

    // --- Estados para Heatmap ---
    const [heatmapSelectedYears, setHeatmapSelectedYears] = useState([]);
    const [heatmapSelectedCountryIds, setHeatmapSelectedCountryIds] = useState([]);
    const [heatmapSelectedProjectIds, setHeatmapSelectedProjectIds] = useState([]);
    const [heatmapSelectedObjective, setHeatmapSelectedObjective] = useState('all');
    const [heatmapSelectedView, setHeatmapSelectedView] = useState('country_year');

    // --- Estados para Gráficos Antigos (do _old) ---
    const [commitmentsSelectedYears, setCommitmentsSelectedYears] = useState([]); // Renomeado de selectedYears
    const [commitmentsSelectedCountries, setCommitmentsSelectedCountries] = useState([]); // Renomeado de selectedRecipientCountries
    const [bubbleSelectedTypes, setBubbleSelectedTypes] = useState([]);
    const [bubbleSelectedFocuses, setBubbleSelectedFocuses] = useState([]);
    const [barSelectedTypes, setBarSelectedTypes] = useState([]);
    const [barSelectedFocuses, setBarSelectedFocuses] = useState([]);
    const [barSelectedFunds, setBarSelectedFunds] = useState([]);
    const [objectiveSelectedYears, setObjectiveSelectedYears] = useState([]);
    const [objectiveSelectedCountries, setObjectiveSelectedCountries] = useState([]);
    const [objectiveSelectedObjectives, setObjectiveSelectedObjectives] = useState(['Adaptação', 'Mitigação', 'Ambos']); // <-- 'Ambos' adicionado

    // --- Estados para dados processados (do _old) ---
    const [lineChartSeries, setLineChartSeries] = useState([]);
    const [bubbleChartData, setBubbleChartData] = useState([]);
    const [barChartData, setBarChartData] = useState(null); // <-- Estado APENAS para o gráfico de barras
    const [objectiveTotals, setObjectiveTotals] = useState([]);

    // --- Loadings dos gráficos (do _old, mas separados) ---
    const [bubbleLoading, setBubbleLoading] = useState(false);
    const [barLoading, setBarLoading] = useState(false); // <-- Loading APENAS para o gráfico de barras
    const [objectiveLoading, setObjectiveLoading] = useState(false);
    const [commitmentsLoading, setCommitmentsLoading] = useState(false);


    // --- Fetch inicial (Combinado) ---
    useEffect(() => {
        const loadInitialData = async () => {
            // [CORREÇÃO] Adicionado setTotalKpisLoading(true)
            setLoadingFilters(true); setKpisLoading(true); setTotalKpisLoading(true); setGlobalError(null);
            try {
                // Carrega todos os filtros, KPIs e dados iniciais em paralelo
                const [
                    yearsData, recipientCountriesData, fundTypesData, fundFocusesData,
                    kpiData, fundsResponse, 
                    // [CORREÇÃO] A variável projectsData foi removida antes, então este é o 7º item
                    initialTotalStatusData 
                ] = await Promise.all([
                    getAvailableYears(),             // 1
                    getRecipientCountries(),         // 2
                    getFundTypes(),                  // 3
                    getFundFocuses(),                // 4
                    getKpisData(),                   // 5
                    getFundsData(),                  // 6 (Para Bubble e filtros)
                    getFundStatusData()              // 7 <-- [CORREÇÃO] Chamada adicionada de volta!
                    // A chamada para buscar projects foi removida antes (usa async agora)
                ]);
                
                setAvailableYears(yearsData || []);
                setAllRecipientCountries(recipientCountriesData || []);
                setFundTypes(fundTypesData || []);
                setFundFocuses(fundFocusesData || []);
                setKpis(kpiData || { total_projects: 0, total_funded_countries: 0 });
                setAllFunds(fundsResponse || []);
                setBubbleChartData(fundsResponse || []);
                setTotalFinancialKpis(initialTotalStatusData || { total_pledge: 0, total_deposit: 0, total_approval: 0 });
                setBarChartData(initialTotalStatusData);

            } catch (error) {
                console.error("Falha ao carregar dados iniciais:", error);
                setGlobalError("Falha ao carregar opções de filtro ou KPIs. Verifique a conexão.");
            } finally {

                setLoadingFilters(false); setKpisLoading(false); setTotalKpisLoading(false);
            }
        };
        loadInitialData();
    }, []);


    // --- Fetch para Gráficos Antigos (Lógica Original do _old + 'loadingFilters') ---

    // Commitments Line Chart Data
    useEffect(() => {
        if (loadingFilters) return; // Espera filtros carregarem
        
        const fetchLineChartData = async () => {
            setCommitmentsLoading(true);
            const countryIds = allRecipientCountries
                .filter(c => commitmentsSelectedCountries.includes(c.name))
                .map(c => c.id);

            const filters = {
                selectedYears: commitmentsSelectedYears,
                selectedCountryIds: countryIds
            };
            
            try {
                const apiSeriesData = await getCommitmentTimeSeries(filters);
                const formattedSeries = apiSeriesData.map(series => ({
                    name: series.name,
                    data: (series.data || []).map(point => [point.year, point.amount || 0]).sort((a,b) => a[0] - b[0])
                }));
                setLineChartSeries(formattedSeries);
            } catch (error) {
                console.error("Falha ao buscar dados para o gráfico de linhas:", error);
                setLineChartSeries([]);
            } finally {
                setCommitmentsLoading(false);
            }
        };
        fetchLineChartData();
    }, [loadingFilters, commitmentsSelectedYears, commitmentsSelectedCountries, allRecipientCountries]);
    
    // Bubble Chart Data
    useEffect(() => {
        if (loadingFilters) return;
        const fetchBubbleData = async () => {
            setBubbleLoading(true);
            const filters = { selectedTypes: bubbleSelectedTypes, selectedFocuses: bubbleSelectedFocuses };
            try {
                const data = await getFundsData(filters);
                setBubbleChartData(data);
            } catch (error) { setBubbleChartData([]); }
            finally { setBubbleLoading(false); }
        };
        fetchBubbleData();
    }, [loadingFilters, bubbleSelectedTypes, bubbleSelectedFocuses]);

    // [CORREÇÃO] Bar Chart Data (useEffect corrigido para buscar totais quando filtros vazios)
    useEffect(() => {
        // Só roda DEPOIS do fetch inicial
        if (loadingFilters) return; 
        
        const fetchBarData = async () => {
            setBarLoading(true);
            // Prepara os filtros (serão arrays vazios se nada for selecionado)
            const filters = { 
                selectedFunds: barSelectedFunds, 
                selectedTypes: barSelectedTypes, 
                selectedFocuses: barSelectedFocuses 
            };
            try {
                // A API getFundStatusData() com filtros vazios deve retornar os totais
                const data = await getFundStatusData(filters);
                setBarChartData(data); // Atualiza o estado do GRÁFICO
            } catch (error) { 
                console.error("Falha ao buscar dados do gráfico de barras:", error);
                setBarChartData(null); 
            } finally { 
                setBarLoading(false); 
            }
        };
        // Roda a função
        fetchBarData();
    // Roda quando loadingFilters muda OU quando QUALQUER filtro da barra muda
    }, [loadingFilters, barSelectedFunds, barSelectedTypes, barSelectedFocuses]); 

    // Objective Line Chart Data
    useEffect(() => {
        if (loadingFilters) return;
        const fetchObjectiveData = async () => {
            setObjectiveLoading(true);
            const filters = {
                selectedYears: objectiveSelectedYears,
                selectedCountryIds: objectiveSelectedCountries // API espera IDs
            };
            try {
                const data = await getTotalsByObjective(filters);
                setObjectiveTotals(data);
            } catch (error) { setObjectiveTotals([]); }
            finally { setObjectiveLoading(false); }
        };
        fetchObjectiveData();
    }, [loadingFilters, objectiveSelectedYears, objectiveSelectedCountries]);

    // --- [CORREÇÃO] useMemo para Objective Chart (com 'Ambos') ---
    const objectiveChartSeries = useMemo(() => {
        if (!objectiveTotals.length) return [];
        
        const adaptationData = objectiveTotals.map(d => [d.year, d.total_adaptation || 0]).sort((a,b) => a[0] - b[0]);
        const mitigationData = objectiveTotals.map(d => [d.year, d.total_mitigation || 0]).sort((a,b) => a[0] - b[0]);
        const overlapData = objectiveTotals.map(d => [d.year, d.total_overlap || 0]).sort((a,b) => a[0] - b[0]);

        const series = [];
        if (objectiveSelectedObjectives.includes('Adaptação')) {
            series.push({ name: 'Adaptação', data: adaptationData, color: Highcharts.getOptions().colors[0] });
        }
        if (objectiveSelectedObjectives.includes('Mitigação')) {
            series.push({ name: 'Mitigação', data: mitigationData, color: Highcharts.getOptions().colors[1] });
        }
        if (objectiveSelectedObjectives.includes('Ambos')) {
             series.push({ name: 'Ambos (Overlap)', data: overlapData, color: Highcharts.getOptions().colors[2] });
        }
        return series;
    }, [objectiveTotals, objectiveSelectedObjectives]);


    // --- Handlers para mudança de filtros (Heatmap) ---
    const handleHeatmapFilterChange = (setter, value) => {
        setter(value);
    };
    
    // --- Handlers para filtros dos gráficos antigos (Originais do _old) ---
    // (Estes são os handlers inline, mantidos para estabilidade)
    const extractValues = (options) => options ? options.map(o => o.value) : [];


    // --- [NOVO] Renderização dos KPIs (Com UX Melhorado e Novos KPIs Financeiros) ---
    const KpiCard = ({ title, value, icon, isLoading, isCurrency = false }) => {
        let formattedValue;
        // Mostrar loading se isLoading for true
        if (isLoading) {
            formattedValue = <LoadingSpinner size="sm" />;
        // Mostrar '-' se o valor for null ou undefined DEPOIS de carregar
        } else if (value === null || value === undefined) {
            formattedValue = <p className="text-2xl font-semibold text-gray-500">-</p>;
        // Mostrar 0 se o valor for 0
        } else if (value === 0) {
            formattedValue = <p className="text-2xl font-semibold text-white">0</p>;
        } else if (isCurrency) {
            // Formatação para Moeda (Milhões ou Milhares)
            if (value >= 1000000) {
                const valueInMillions = value / 1000000;
                formattedValue = <p className="text-2xl font-semibold text-white">{`${valueInMillions.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`}</p>;
            } else if (value >= 1000) {
                 const valueInThousands = value / 1000;
                 formattedValue = <p className="text-2xl font-semibold text-white">{`${valueInThousands.toLocaleString(undefined, { maximumFractionDigits: 0 })} k`}</p>;
            } else {
                 formattedValue = <p className="text-2xl font-semibold text-white">{value.toLocaleString()}</p>;
            }
        } else {
            // Formatação para Número
            formattedValue = <p className="text-2xl font-semibold text-white">{value.toLocaleString()}</p>;
        }

        return (
            // Design vertical
            <div className="bg-dark-card p-4 rounded-lg shadow border border-dark-border flex flex-col items-center text-center">
                <div className="text-4xl text-accent-blue mb-3">
                    {icon}
                </div>
                <div>
                    <h3 className="text-xs font-medium text-dark-text-secondary mb-1">{title}</h3>
                    {formattedValue}
                </div>
            </div>
        );
    };

    const renderKpis = () => (
        // Stack vertical
        <div className="flex flex-col space-y-4">
            {/* KPIs originais */}
            <KpiCard title="Total Projetos" value={kpis.total_projects} icon={<FiBox />} isLoading={kpisLoading} />
            <KpiCard title="Total Países" value={kpis.total_funded_countries} icon={<FiGlobe />} isLoading={kpisLoading || loadingFilters} />
            
            {/* KPIs Financeiros (usam totalFinancialKpis e totalKpisLoading) */}
            <KpiCard 
                title="Total Promessas (Pledge)" 
                // Acessa o valor do estado correto
                value={totalFinancialKpis?.total_pledge} 
                icon={<FiDollarSign />}
                // Usa o loading correto
                isLoading={totalKpisLoading} 
                isCurrency={true} 
            />
            <KpiCard 
                title="Total Depósitos (Deposit)" 
                // Acessa o valor do estado correto
                value={totalFinancialKpis?.total_deposit} 
                icon={<FiArrowDownCircle />}
                 // Usa o loading correto
                isLoading={totalKpisLoading}
                isCurrency={true} 
            />
            <KpiCard 
                title="Total Aprovações (Approval)" 
                // Acessa o valor do estado correto
                value={totalFinancialKpis?.total_approval} 
                icon={<FiCheckSquare />}
                 // Usa o loading correto
                isLoading={totalKpisLoading}
                isCurrency={true} 
            />
        </div>
    );

    // --- Renderização Principal ---
    if (loadingFilters) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;

    return (
        <div className="p-4 md:p-6 space-y-6">
            {globalError && (
                 <div className="p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-md">
                    Erro ao carregar dados: {globalError}
                 </div>
            )}

            {/* --- Nova Linha Superior: KPIs + Heatmap --- */}
            {/* [CORREÇÃO LAYOUT] Adicionado 'items-start' para alinhar a coluna do KPI ao topo */}
            {/* Altura mínima ajustada para acomodar o Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[700px] items-stretch mb-12">
                
                {/* [CORREÇÃO LAYOUT] Coluna Esquerda: KPIs (Agora alinhada ao topo e com novo design) */}
                <div className="lg:col-span-1 self-start">
                    {renderKpis()}
                </div>

                {/* Coluna Direita: Filtros e Heatmap */}
                <div className="lg:col-span-3 h-full self-stretch min-h-0 overflow-hidden">
                    <ChartCard
                        title="Doações por País e Ano"
                        className="h-full pb-6 overflow-visible"
                        sourceClassName="mt-4"
                        sources={[DATA_SOURCES.oecd]}
                    >
                        {/* Filtros Heatmap */}
                        <HeatmapFilters
                            allYears={availableYears}
                            allCountries={allRecipientCountries} // Passa objetos {id, name}
                            
                            selectedYears={heatmapSelectedYears}
                            selectedCountryIds={heatmapSelectedCountryIds}
                            selectedProjectIds={heatmapSelectedProjectIds}
                            selectedObjective={heatmapSelectedObjective}
                            selectedView={heatmapSelectedView}
                            
                            onYearChange={(value) => handleHeatmapFilterChange(setHeatmapSelectedYears, value)}
                            onCountryChange={(value) => handleHeatmapFilterChange(setHeatmapSelectedCountryIds, value)}
                            onProjectChange={(value) => handleHeatmapFilterChange(setHeatmapSelectedProjectIds, value)}
                            onObjectiveChange={(value) => handleHeatmapFilterChange(setHeatmapSelectedObjective, value)}
                            onViewChange={(value) => handleHeatmapFilterChange(setHeatmapSelectedView, value)}
                        />
                        {/* Container do HeatmapChart usa flex-grow e min-h-0 */}
                        <div className="mt-4 flex-grow min-h-0 overflow-hidden">
                            <HeatmapChart
                                filters={{
                                    years: heatmapSelectedYears,
                                    country_ids: heatmapSelectedCountryIds,
                                    project_ids: heatmapSelectedProjectIds,
                                    objective: heatmapSelectedObjective,
                                    view: heatmapSelectedView,
                                }}
                                loadingFilters={loadingFilters}
                            />
                        </div>
                    </ChartCard>
                </div>
            </div>

            {/* --- Seção Inferior: Gráficos Antigos (Layout Original + Correção de Altura) --- */}
            
            {/* [CORREÇÃO LAYOUT] Altura da LINHA definida aqui (mantendo seus 850px) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[800px]"> {/* Ajuste de altura para reduzir espaço vazio */}
                <ChartCard
                    title="Análise de Fundos por Tamanho"
                    sources={[DATA_SOURCES.cfu]}
                    sourceClassName="mt-1"
                >
                     <BubbleChartFilters
                        allFunds={allFunds} // Passa allFunds
                        fundTypes={fundTypes}
                        fundFocuses={fundFocuses}
                        selectedTypes={bubbleSelectedTypes}
                        selectedFocuses={bubbleSelectedFocuses}
                        onTypeChange={(options) => setBubbleSelectedTypes(extractValues(options))}
                        onFocusChange={(options) => setBubbleSelectedFocuses(extractValues(options))}
                     />
                     {/* [CORREÇÃO LAYOUT] Removida altura fixa h-[600px] */}
                     <div className="mt-4 flex-1 min-h-0">
                        {bubbleLoading ? <div className="h-full flex items-center justify-center"><LoadingSpinner/></div> : <BubbleChart fundsData={bubbleChartData} />}
                     </div>
                </ChartCard>

                 <ChartCard
                     title="Status Financeiro Agregado"
                     sources={[DATA_SOURCES.cfu]}
                     sourceClassName="mt-1"
                 >
                     <BarChartFilters
                        allFunds={allFunds}
                        allFundTypes={fundTypes}
                        allFundFocuses={fundFocuses}
                        selectedFundIds={barSelectedFunds}
                        selectedTypes={barSelectedTypes}
                        selectedFocuses={barSelectedFocuses}
                        onFundChange={(options) => setBarSelectedFunds(extractValues(options))}
                        onTypeChange={(options) => setBarSelectedTypes(extractValues(options))}
                        onFocusChange={(options) => setBarSelectedFocuses(extractValues(options))}
                    />
                      {/* [CORREÇÃO LAYOUT] Removida altura fixa h-[600px] e pb-4 */}
                      <div className="mt-4 flex-1 min-h-0">
                        {/* Usa barChartData e barLoading (não totalKpisLoading) */}
                        {barLoading ? <div className="h-full flex items-center justify-center"><LoadingSpinner/></div> : <BarChart statusData={barChartData} />}
                      </div>
                 </ChartCard>
            </div>

            {/* [CORREÇÃO LAYOUT] Altura da LINHA definida aqui */}
            <div className="grid grid-cols-1 gap-6 h-[560px]">
                <ChartCard
                    title="Financiamento por Objetivo Climático"
                    className="pb-8"
                    sourceClassName="mt-4"
                    sources={[DATA_SOURCES.oecd]}
                >
                     <ObjectiveFilters
                        years={availableYears}
                        countries={allRecipientCountries} // Passa OBJETOS {id, name}
                        objectives={['Adaptação', 'Mitigação', 'Ambos']} // [CORREÇÃO] Adicionado 'Ambos'
                        selectedYears={objectiveSelectedYears}
                        selectedCountries={objectiveSelectedCountries} // Espera IDs
                        selectedObjectives={objectiveSelectedObjectives} // Espera Nomes
                        onYearChange={setObjectiveSelectedYears}
                        onCountryChange={setObjectiveSelectedCountries}
                        onObjectiveChange={setObjectiveSelectedObjectives}
                    />
                     {/* [CORREÇÃO LAYOUT] Removida altura fixa h-[400px] */}
                     <div className="mt-4 flex-grow min-h-0">
                        {objectiveLoading ? <div className="h-full flex items-center justify-center"><LoadingSpinner/></div> : <ObjectiveLineChart seriesData={objectiveChartSeries} />}
                     </div>
                 </ChartCard>
            </div>

            {/* [CORREÇÃO LAYOUT] Altura da LINHA definida aqui */}
             <div className="grid grid-cols-1 gap-6 h-[560px]">
                 <ChartCard
                     title="Evolução do Financiamento por País Receptor"
                     className="pb-8"
                     sourceClassName="mt-4"
                     sources={[DATA_SOURCES.oecd]}
                 >
                    <Filters // Nome original
                        years={availableYears}
                        countries={allRecipientCountries.map(c => c.name)} // Passa NOMES
                        selectedYears={commitmentsSelectedYears}
                        selectedCountries={commitmentsSelectedCountries} // Espera NOMES
                        onYearChange={setCommitmentsSelectedYears}
                        onCountryChange={setCommitmentsSelectedCountries}
                    />
                    {/* [CORREÇÃO LAYOUT] Removida altura fixa h-[400px] */}
                     <div className="mt-4 flex-grow min-h-0">
                        {commitmentsLoading ? <div className="h-full flex items-center justify-center"><LoadingSpinner/></div> : <LineChart seriesData={lineChartSeries} />}
                     </div>
                 </ChartCard>
            </div>
        </div>
    );
};

export default DashboardPage;
