// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    getSankeyDiagramData,
    getKpisData,
} from '../services/api';

// Importe TODOS os componentes
import SankeyFilters from '../components/dashboard/SankeyFilters';
import SankeyChart from '../components/dashboard/SankeyChart';
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
const ChartCard = ({ title, children, className = "" }) => (
    // Adicionado overflow-hidden para garantir que o conteúdo não vaze
    <div className={`bg-dark-card border border-dark-border rounded-xl p-4 flex flex-col h-full overflow-hidden ${className}`}>
        {title && <h3 className="text-xl font-semibold text-dark-text mb-4">{title}</h3>}
        {/* flex-grow e min-h-0 permitem que o conteúdo interno use o espaço */}
        <div className="flex-grow flex flex-col min-h-0">{children}</div>
    </div>
);

// Constante de paginação do Sankey
const ITEMS_PER_PAGE_SANKEY = 5;

const DashboardPage = () => {
    // --- Estados para dados de opções dos filtros (do _old) ---
    const [allFunds, setAllFunds] = useState([]);
    const [fundTypes, setFundTypes] = useState([]);
    const [fundFocuses, setFundFocuses] = useState([]);
    const [allRecipientCountries, setAllRecipientCountries] = useState([]);
    const [availableYears, setAvailableYears] = useState([]);
    const [allProjects, setAllProjects] = useState([]); // <-- NOVO para filtro Sankey
    const [loadingFilters, setLoadingFilters] = useState(true); // Renomeado de 'loading'
    const [globalError, setGlobalError] = useState(null); // Renomeado de 'error'

    // --- Estados para KPIs (NOVO) ---
    const [kpis, setKpis] = useState({ total_projects: 0, total_funded_countries: 0 });
    const [kpisLoading, setKpisLoading] = useState(true);
    // [NOVO] Estado para os KPIs financeiros TOTAIS (separado do gráfico de barras)
    const [totalFinancialKpis, setTotalFinancialKpis] = useState({ total_pledge: 0, total_deposit: 0, total_approval: 0 });
    const [totalKpisLoading, setTotalKpisLoading] = useState(true); // Loading para os KPIs financeiros

    // --- Estados para Sankey (NOVO) ---
    const [sankeySelectedYears, setSankeySelectedYears] = useState([]); // <-- Corrigido para array (multi-select)
    const [sankeySelectedCountryIds, setSankeySelectedCountryIds] = useState([]);
    const [sankeySelectedProjectIds, setSankeySelectedProjectIds] = useState([]); // <-- NOVO
    const [sankeySelectedObjective, setSankeySelectedObjective] = useState('all');
    const [sankeySelectedView, setSankeySelectedView] = useState('project_country_year');
    const [sankeyData, setSankeyData] = useState([]);
    const [sankeyTotalProjects, setSankeyTotalProjects] = useState(0);
    const [sankeyCurrentPage, setSankeyCurrentPage] = useState(0);
    const [sankeyLoading, setSankeyLoading] = useState(false);
    const [sankeyError, setSankeyError] = useState(null);

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

    // --- Fetch Sankey data (Callback) ---
    const fetchSankeyData = useCallback(async (page) => {
        setSankeyLoading(true); setSankeyError(null);
        try {
            const filters = {
                // 'year' não é mais enviado, 'years' é
                years: sankeySelectedYears, // <-- Corrigido para 'years' (array)
                country_ids: sankeySelectedCountryIds,
                project_ids: sankeySelectedProjectIds, // <-- NOVO
                objective: sankeySelectedObjective,
                view: sankeySelectedView,
                limit: ITEMS_PER_PAGE_SANKEY,
                offset: page * ITEMS_PER_PAGE_SANKEY,
            };
            const result = await getSankeyDiagramData(filters);
            if (result.error) { throw new Error(result.error); }
            setSankeyData(result.data || []);
            setSankeyTotalProjects(result.total_projects || 0);
        } catch (error) {
            console.error("Falha fetchSankeyData:", error);
            setSankeyError(`Falha Sankey: ${error.message}`);
            setSankeyData([]); setSankeyTotalProjects(0);
        } finally {
            setSankeyLoading(false);
        }
    }, [sankeySelectedYears, sankeySelectedCountryIds, sankeySelectedProjectIds, sankeySelectedObjective, sankeySelectedView]);

    // --- Efeito para buscar dados do Sankey ---
    useEffect(() => {
        // Só busca dados se os filtros não estiverem carregando
        if (!loadingFilters) {
            fetchSankeyData(sankeyCurrentPage);
        }
    }, [fetchSankeyData, sankeyCurrentPage, loadingFilters]);

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


    // --- Handlers para mudança de filtros (Sankey - NOVOS) ---
    // Handler genérico que reseta a página para 0 ao mudar qualquer filtro
    const handleSankeyFilterChange = (setter, value) => {
        setter(value);
        setSankeyCurrentPage(0);
    };
    const handleSankeyPageChange = (newPage) => {
        const totalPages = Math.ceil(sankeyTotalProjects / ITEMS_PER_PAGE_SANKEY);
        if (newPage >= 0 && newPage < totalPages) {
            setSankeyCurrentPage(newPage);
        }
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

            {/* --- Nova Linha Superior: KPIs + Sankey --- */}
            {/* [CORREÇÃO LAYOUT] Adicionado 'items-start' para alinhar a coluna do KPI ao topo */}
            {/* Altura mínima ajustada para acomodar o Sankey */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[700px] md:min-h-[700px] items-start">
                
                {/* [CORREÇÃO LAYOUT] Coluna Esquerda: KPIs (Agora alinhada ao topo e com novo design) */}
                <div className="lg:col-span-1">
                    {renderKpis()}
                </div>

                {/* Coluna Direita: Filtros e Gráfico Sankey */}
                <div className="lg:col-span-3 h-full"> {/* Adicionado h-full aqui */}
                    <ChartCard title="Fluxo de Financiamento por Projeto (Top 5 por Página)" className="h-full">
                        {/* Filtros Sankey */}
                        <SankeyFilters
                            allYears={availableYears}
                            allCountries={allRecipientCountries} // Passa objetos {id, name}
                            
                            selectedYears={sankeySelectedYears} // <-- Corrigido (array)
                            selectedCountryIds={sankeySelectedCountryIds}
                            selectedProjectIds={sankeySelectedProjectIds} // <-- NOVO
                            selectedObjective={sankeySelectedObjective}
                            selectedView={sankeySelectedView}
                            
                            onYearChange={(value) => handleSankeyFilterChange(setSankeySelectedYears, value)} // <-- Corrigido
                            onCountryChange={(value) => handleSankeyFilterChange(setSankeySelectedCountryIds, value)}
                            onProjectChange={(value) => handleSankeyFilterChange(setSankeySelectedProjectIds, value)} // <-- NOVO
                            onObjectiveChange={(value) => handleSankeyFilterChange(setSankeySelectedObjective, value)}
                            onViewChange={(value) => handleSankeyFilterChange(setSankeySelectedView, value)}
                        />
                        {/* Container do SankeyChart usa flex-grow e min-h-0 */}
                        <div className="mt-4 flex-grow min-h-0">
                            <SankeyChart
                                chartData={sankeyData}
                                totalItems={sankeyTotalProjects}
                                currentPage={sankeyCurrentPage}
                                itemsPerPage={ITEMS_PER_PAGE_SANKEY}
                                onPageChange={handleSankeyPageChange}
                                isLoading={sankeyLoading}
                                error={sankeyError}
                                view={sankeySelectedView}
                            />
                        </div>
                    </ChartCard>
                </div>
            </div>

            {/* --- Seção Inferior: Gráficos Antigos (Layout Original + Correção de Altura) --- */}
            
            {/* [CORREÇÃO LAYOUT] Altura da LINHA definida aqui (mantendo seus 850px) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[850px]"> {/* Reduzido para 700px */}
                <ChartCard title="Análise de Fundos por Tamanho">
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
                     <div className="mt-4 flex-grow min-h-0">
                        {bubbleLoading ? <div className="h-full flex items-center justify-center"><LoadingSpinner/></div> : <BubbleChart fundsData={bubbleChartData} />}
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
                        onFundChange={(options) => setBarSelectedFunds(extractValues(options))}
                        onTypeChange={(options) => setBarSelectedTypes(extractValues(options))}
                        onFocusChange={(options) => setBarSelectedFocuses(extractValues(options))}
                    />
                      {/* [CORREÇÃO LAYOUT] Removida altura fixa h-[600px] e pb-4 */}
                      <div className="mt-4 flex-grow min-h-0">
                        {/* Usa barChartData e barLoading (não totalKpisLoading) */}
                        {barLoading ? <div className="h-full flex items-center justify-center"><LoadingSpinner/></div> : <BarChart statusData={barChartData} />}
                      </div>
                 </ChartCard>
            </div>

            {/* [CORREÇÃO LAYOUT] Altura da LINHA definida aqui */}
            <div className="grid grid-cols-1 gap-6 h-[500px]">
                <ChartCard title="Financiamento por Objetivo Climático">
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
             <div className="grid grid-cols-1 gap-6 h-[500px]">
                 <ChartCard title="Evolução do Financiamento por País Receptor">
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