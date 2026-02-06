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
    getCommitmentTimeSeries, getAvailableYears, getHeatmapFilterOptions,
    // --- Novas funções ---
    getHeatmapKpis,
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
import { FiBox, FiGlobe, FiDollarSign, FiShuffle } from 'react-icons/fi';
import { IoSyncCircle } from 'react-icons/io5';
import { RiShieldCheckLine } from 'react-icons/ri';

// --- [CORREÇÃO] ChartCard atualizado para suportar layout flexível ---
const ChartCard = ({
    title,
    children,
    className = "",
    sources = [],
    sourceClassName = "mt-2",
    dataTour,
}) => (
    // Adicionado overflow-hidden para garantir que o conteúdo não vaze
    <div
        className={`relative bg-dark-card border border-dark-border rounded-xl p-4 pb-4 flex flex-col h-full min-h-0 overflow-hidden ${className}`}
        data-tour={dataTour}
    >
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
    const [heatmapAvailableYears, setHeatmapAvailableYears] = useState(null);
    const [heatmapAvailableCountries, setHeatmapAvailableCountries] = useState(null);
    const [heatmapAvailableObjectives, setHeatmapAvailableObjectives] = useState(null);
    const [loadingFilters, setLoadingFilters] = useState(true); // Renomeado de 'loading'
    const [globalError, setGlobalError] = useState(null); // Renomeado de 'error'

    // --- Estados para KPIs do Heatmap ---
    const [heatmapKpis, setHeatmapKpis] = useState({
        total_projects: 0,
        total_countries: 0,
        total_amount: 0,
        total_mitigation: 0,
        total_adaptation: 0,
        total_overlap: 0,
    });
    const [heatmapKpisLoading, setHeatmapKpisLoading] = useState(true);

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
    const [objectiveSelectedObjectives, setObjectiveSelectedObjectives] = useState(['Adaptação', 'Mitigação', 'Ambos']);

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
            setLoadingFilters(true); setHeatmapKpisLoading(true); setGlobalError(null);
            try {
                // Carrega todos os filtros, KPIs e dados iniciais em paralelo
                const [
                    yearsData, recipientCountriesData, fundTypesData, fundFocusesData,
                    fundsResponse,
                    // [CORREÇÃO] A variável projectsData foi removida antes, então este é o 7º item
                    initialTotalStatusData 
                ] = await Promise.all([
                    getAvailableYears(),             // 1
                    getRecipientCountries(),         // 2
                    getFundTypes(),                  // 3
                    getFundFocuses(),                // 4
                    getFundsData(),                  // 5 (Para Bubble e filtros)
                    getFundStatusData()              // 6 <-- [CORREÇÃO] Chamada adicionada de volta!
                    // A chamada para buscar projects foi removida antes (usa async agora)
                ]);
                
                setAvailableYears(yearsData || []);
                setAllRecipientCountries(recipientCountriesData || []);
                setHeatmapAvailableYears(yearsData || []);
                setHeatmapAvailableCountries(recipientCountriesData || []);
                setFundTypes(fundTypesData || []);
                setFundFocuses(fundFocusesData || []);
                setAllFunds(fundsResponse || []);
                setBubbleChartData(fundsResponse || []);
                setBarChartData(initialTotalStatusData);

            } catch (error) {
                console.error("Falha ao carregar dados iniciais:", error);
                setGlobalError("Falha ao carregar opções de filtro ou KPIs. Verifique a conexão.");
            } finally {
                setLoadingFilters(false);
                setHeatmapKpisLoading(false);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        if (loadingFilters) return;
        const fetchHeatmapKpis = async () => {
            setHeatmapKpisLoading(true);
            try {
                const data = await getHeatmapKpis({
                    years: heatmapSelectedYears,
                    country_ids: heatmapSelectedCountryIds,
                    project_ids: heatmapSelectedProjectIds,
                    objective: heatmapSelectedObjective,
                });
                setHeatmapKpis(data);
            } catch (error) {
                console.error("Falha ao buscar KPIs do heatmap:", error);
                setHeatmapKpis({
                    total_projects: 0,
                    total_countries: 0,
                    total_amount: 0,
                    total_mitigation: 0,
                    total_adaptation: 0,
                    total_overlap: 0,
                });
            } finally {
                setHeatmapKpisLoading(false);
            }
        };
        fetchHeatmapKpis();
    }, [
        loadingFilters,
        heatmapSelectedYears,
        heatmapSelectedCountryIds,
        heatmapSelectedProjectIds,
        heatmapSelectedObjective,
    ]);

    useEffect(() => {
        if (loadingFilters) return;
        let isMounted = true;
        const fetchHeatmapFilterOptions = async () => {
            try {
                const data = await getHeatmapFilterOptions({
                    years: heatmapSelectedYears,
                    countryIds: heatmapSelectedCountryIds,
                    projectIds: heatmapSelectedProjectIds,
                    objective: heatmapSelectedObjective,
                });
                if (!isMounted) return;
                setHeatmapAvailableYears(data.years || []);
                setHeatmapAvailableCountries(data.countries || []);
                setHeatmapAvailableObjectives(data.objectives || ['all', 'adaptation', 'mitigation', 'both']);
            } catch (error) {
                console.error("Falha ao buscar filtros do heatmap:", error);
            }
        };
        fetchHeatmapFilterOptions();
        return () => {
            isMounted = false;
        };
    }, [
        loadingFilters,
        heatmapSelectedYears,
        heatmapSelectedCountryIds,
        heatmapSelectedProjectIds,
        heatmapSelectedObjective,
    ]);


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
             series.push({ name: 'Ambos', data: overlapData, color: Highcharts.getOptions().colors[2] });
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
    const KpiCard = ({
        title,
        value,
        icon,
        isLoading,
        isCurrency = false,
        accentColor = '#58A6FF',
        gaugePercent,
        watermarkIcon,
    }) => {
        let displayValue = '-';
        let valueClassName = "text-3xl font-semibold text-white leading-tight";

        if (isLoading) {
            displayValue = <LoadingSpinner size="xs" inline />;
            valueClassName = "text-xl font-semibold text-white leading-tight flex items-center";
        } else if (value === null || value === undefined) {
            displayValue = '-';
            valueClassName = "text-2xl font-semibold text-gray-500 leading-tight";
        } else if (value === 0) {
            displayValue = '0';
        } else if (isCurrency) {
            // Valores de compromissos estão em milhares de USD
            if (value >= 1_000_000) {
                const valueInBillions = value / 1_000_000;
                displayValue = `${valueInBillions.toLocaleString(undefined, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                })} bi`;
            } else if (value >= 1000) {
                const valueInMillions = value / 1000;
                displayValue = `${valueInMillions.toLocaleString(undefined, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                })} mi`;
            } else {
                displayValue = `${value.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                })} mil`;
            }
        } else {
            displayValue = value.toLocaleString();
        }

        const showGauge = typeof gaugePercent === 'number';
        const clampedGauge = showGauge ? Math.max(0, Math.min(100, gaugePercent)) : 0;
        const percentLabel = `${clampedGauge.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
        const gaugeTrack = '#1d2430';
        const pointerRotation = -90 + (clampedGauge / 100) * 180;
        const paddingRight = showGauge || watermarkIcon ? 'pr-28' : '';

        return (
            <div className={`relative flex h-full min-h-0 flex-col justify-between rounded-2xl border border-dark-border/70 bg-gradient-to-br from-[#111827] via-[#0e1623] to-[#0b111b] p-3 shadow-[0_12px_22px_rgba(0,0,0,0.35)] ${paddingRight}`}>
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: accentColor }} />
                {watermarkIcon && !showGauge && (
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[68px] opacity-15">
                        <span style={{ color: accentColor }}>{watermarkIcon}</span>
                    </div>
                )}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-border bg-dark-card/70 text-[22px]">
                        <span style={{ color: accentColor }}>{icon}</span>
                    </div>
                </div>
                {showGauge && (
                    <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2">
                        <div className="relative h-16 w-28">
                            <svg className="h-full w-full" viewBox="0 0 100 60">
                                <path
                                    d="M10 50 A40 40 0 0 1 90 50"
                                    fill="none"
                                    stroke={gaugeTrack}
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M10 50 A40 40 0 0 1 90 50"
                                    fill="none"
                                    stroke={accentColor}
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    pathLength="100"
                                    strokeDasharray={`${clampedGauge} 100`}
                                />
                                <g transform={`rotate(${pointerRotation} 50 50)`}>
                                    <line
                                        x1="50"
                                        y1="50"
                                        x2="50"
                                        y2="18"
                                        stroke="#E5E7EB"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                    <circle cx="50" cy="50" r="3" fill="#E5E7EB" />
                                </g>
                            </svg>
                            <div className="absolute inset-x-0 bottom-0 flex justify-center">
                                <div className="rounded-full bg-dark-card/90 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow">
                                    {isLoading ? (
                                        <div className="h-2.5 w-12 animate-pulse rounded-full bg-dark-border/70" />
                                    ) : (
                                        percentLabel
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="mt-2.5">
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-dark-text-secondary">
                        {title}
                    </h3>
                    <div className={`mt-1 ${valueClassName}`}>{displayValue}</div>
                    {showGauge && (
                        <p className="mt-0 text-[10px] text-dark-text-secondary">do montante total</p>
                    )}
                </div>
            </div>
        );
    };

    const renderKpis = () => (
        <div className="grid min-h-0 max-h-[900px] grid-rows-6 gap-3 h-full">
            <KpiCard
                title="Total Projetos"
                value={heatmapKpis.total_projects}
                icon={<FiBox />}
                watermarkIcon={<FiBox />}
                isLoading={heatmapKpisLoading}
                accentColor="#58A6FF"
            />
            <KpiCard
                title="Total Países"
                value={heatmapKpis.total_countries}
                icon={<FiGlobe />}
                watermarkIcon={<FiGlobe />}
                isLoading={heatmapKpisLoading}
                accentColor="#58A6FF"
            />
            <KpiCard
                title="Montante Total (USD)"
                value={heatmapKpis.total_amount}
                icon={<FiDollarSign />}
                watermarkIcon={<FiDollarSign />}
                isLoading={heatmapKpisLoading}
                isCurrency={true}
                accentColor="#58A6FF"
            />
            <KpiCard
                title="Mitigação (USD)"
                value={heatmapKpis.total_mitigation}
                icon={<RiShieldCheckLine />}
                isLoading={heatmapKpisLoading}
                isCurrency={true}
                accentColor="#58A6FF"
                gaugePercent={
                    heatmapKpis.total_amount
                        ? (heatmapKpis.total_mitigation / heatmapKpis.total_amount) * 100
                        : 0
                }
            />
            <KpiCard
                title="Adaptação (USD)"
                value={heatmapKpis.total_adaptation}
                icon={<IoSyncCircle />}
                isLoading={heatmapKpisLoading}
                isCurrency={true}
                accentColor="#58A6FF"
                gaugePercent={
                    heatmapKpis.total_amount
                        ? (heatmapKpis.total_adaptation / heatmapKpis.total_amount) * 100
                        : 0
                }
            />
            <KpiCard
                title="Ambos (USD)"
                value={heatmapKpis.total_overlap}
                icon={<FiShuffle />}
                isLoading={heatmapKpisLoading}
                isCurrency={true}
                accentColor="#58A6FF"
                gaugePercent={
                    heatmapKpis.total_amount
                        ? (heatmapKpis.total_overlap / heatmapKpis.total_amount) * 100
                        : 0
                }
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
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[640px] items-stretch mb-[280px]">
                
                {/* [CORREÇÃO LAYOUT] Coluna Esquerda: KPIs (Agora alinhada ao topo e com novo design) */}
                <div className="lg:col-span-1 h-full self-stretch">
                    {renderKpis()}
                </div>

                {/* Coluna Direita: Filtros e Heatmap */}
                <div className="lg:col-span-3 h-full self-stretch min-h-0 overflow-hidden">
                <ChartCard
                    title="Doações por País Receptor e Ano"
                    className="h-full pb-6"
                    sourceClassName="mt-4"
                    sources={[DATA_SOURCES.oecd]}
                    dataTour="heatmap-chart"
                >
                        {/* Filtros Heatmap */}
                        <HeatmapFilters
                            allYears={heatmapAvailableYears ?? availableYears}
                            allCountries={heatmapAvailableCountries ?? allRecipientCountries} // Passa objetos {id, name}
                            availableObjectives={heatmapAvailableObjectives ?? ['all', 'adaptation', 'mitigation', 'both']}
                            
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[800px] "> {/* Ajuste de altura para reduzir espaço vazio */}
                <ChartCard
                    title="Análise de Fundos por Tamanho"
                    sources={[DATA_SOURCES.cfu]}
                    sourceClassName="mt-1"
                    dataTour="bubble-chart"
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
                     dataTour="status-chart"
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
                    dataTour="objective-chart"
                >
                     <ObjectiveFilters
                        years={availableYears}
                        countries={allRecipientCountries} // Passa OBJETOS {id, name}
                        objectives={['Adaptação', 'Mitigação', 'Ambos']}
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
                     dataTour="commitments-chart"
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
