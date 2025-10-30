// src/components/dashboard/SankeyChart.jsx
// [SEU ARQUIVO ORIGINAL - JÁ ESTAVA CORRETO]
import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsSankey from 'highcharts/modules/sankey';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import LoadingSpinner from '../common/LoadingSpinner';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';


const SankeyChart = ({
    chartData,
    totalItems,
    currentPage,
    itemsPerPage,
    onPageChange,
    isLoading,
    error,
    view
}) => {

    const chartTitle = null; 
    const isYear = (str) => /^\d{4}$/.test(str);

    // --- Opções Highcharts (CORRIGIDAS) ---
    const options = {
        chart: {
            backgroundColor: 'transparent',
            // Altura será 100% do container pai (flex-grow)
            // height: undefined, // Remover altura fixa
            zooming: { type: 'xy' },
            panning: { enabled: true, type: 'xy' },
            panKey: 'shift'
        },
        title: {
            text: chartTitle,
        },
        subtitle: {
            text: totalItems > 0
                ? `Mostrando projetos ${currentPage * itemsPerPage + 1} - ${Math.min((currentPage + 1) * itemsPerPage, totalItems)} de ${totalItems}`
                : 'Nenhum projeto encontrado',
        },
        accessibility: {
             point: {
                 valueDescriptionFormat: '{index}. {point.from} para {point.to}, valor {point.weight}.'
             }
         },
        tooltip: {
            useHTML: true, 
            pointFormatter: function () { // Usar pointFormatter para controle total
                const point = this;
                const tooltipData = point.options?.detailed_data; // Acesso seguro
                const fromNode = point.from ?? 'Origem Desconhecida'; // Fallback
                const toNode = point.to ?? 'Destino Desconhecido';   // Fallback
                const weightFormatted = Highcharts.numberFormat(point.weight || 0, 0, '.', ',');

                let fromPrefix = "Fluxo de:";
                let toPrefix = "Para:";

                if (view === 'project_country_year') {
                    if (!isYear(fromNode) && !isYear(toNode)) { // Projeto -> País
                        fromPrefix = "Fluxo do Projeto:";
                        toPrefix = "Para o País:";
                    } else if (!isYear(fromNode) && isYear(toNode)) { // País -> Ano
                         fromPrefix = "Fluxo do País:";
                         toPrefix = "Para o Ano:";
                    }
                } else if (view === 'project_year_country') {
                     if (!isYear(fromNode) && isYear(toNode)) { // Projeto -> Ano
                        fromPrefix = "Fluxo do Projeto:";
                        toPrefix = "Para o Ano:";
                    } else if (isYear(fromNode) && !isYear(toNode)) { // Ano -> País
                         fromPrefix = "Fluxo do Ano:";
                         toPrefix = "Para o País:";
                    }
                }

                let details = '';
                if (tooltipData) {
                    const adaEx = Highcharts.numberFormat(tooltipData.adaptation_exclusive || 0, 0, '.', ',');
                    const mitEx = Highcharts.numberFormat(tooltipData.mitigation_exclusive || 0, 0, '.', ',');
                    const over = Highcharts.numberFormat(tooltipData.overlap || 0, 0, '.', ',');
                    const colors = Highcharts.getOptions().colors || ['#7cb5ec', '#434348', '#90ed7d'];
                    details = `<br/><span style="color:${colors[0]};">●</span> Adapt (Excl): ${adaEx} K USD` +
                              `<br/><span style="color:${colors[1]};">●</span> Mitig (Excl): ${mitEx} K USD` +
                              `<br/><span style="color:${colors[2]};">●</span> Ambos: ${over} K USD`;
                }

                return `<div style="font-size: 10px;">${fromPrefix}</div><b>${fromNode}</b><br/>` +
                       `<div style="font-size: 10px; margin-top: 5px;">${toPrefix}</div><b> → ${toNode}</b><br/>` +
                       `<div style="margin-top: 8px; border-top: 1px solid #555; padding-top: 5px;">` +
                       `Total: <b>${weightFormatted} K USD</b>${details}</div>`;
            },
            nodeFormatter: function() {
                // 'this' aqui se refere ao ponto (nó)
                const name = this.name || this.key || 'Desconhecido'; // Acessa o nome do nó
                const sum = this.sum; // Acessa a soma total do nó
                const formattedSum = Highcharts.numberFormat(sum || 0, 0, '.', ',') + ' K USD';
                
                let prefix = '';
                const column = this.column; // Coluna do nó (0, 1, 2...)

                // Determina o prefixo baseado na coluna e na view
                if (column === 0) {
                    prefix = 'Projeto:';
                } else if (column === 1) {
                    prefix = (view === 'project_country_year') ? 'País:' : 'Ano:';
                } else if (column === 2) {
                     prefix = (view === 'project_country_year') ? 'Ano:' : 'País:';
                } else {
                    prefix = 'Nodo:'; // Fallback
                }

                return `${prefix} ${name}<br/>Valor: ${formattedSum}`;
            },
            outside: true 
        },
        series: [{
            keys: ['from', 'to', 'weight', 'detailed_data'], // Confirma que corresponde ao JSON
            data: chartData, 
            type: 'sankey',
            name: 'Fluxo de Financiamento', 
            dataLabels: { // Labels nos NÓS
                enabled: true,
                style: {
                    textOutline: 'none',
                    fontSize: '10px',
                    fontWeight: 'normal',
                    color: '#E0E0E0'
                },
                // Formata o label do NÓ (Sua implementação)
                nodeFormatter: function() {
                    const name = this.key || '';
                    const maxLength = 35; 
                    const truncatedName = name.length > maxLength
                        ? name.substring(0, maxLength) + '...' // Simplificado
                        : name;
                    const valueFormatted = Highcharts.numberFormat(this.sum || 0, 0, '.', ',');
                    return `${truncatedName}<br/> (${valueFormatted} K)`; // Adiciona quebra de linha
                },
            },
            nodeWidth: 15, 
            nodePadding: 15, 
            linkOpacity: 0.5, 
            borderWidth: 0, 
        }],
        exporting: { enabled: true },
        credits: { enabled: false }
    };

    // --- Lógica de Paginação ---
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const canGoPrevious = currentPage > 0;
    const canGoNext = currentPage < totalPages - 1;

    return (
        <div className="flex flex-col h-full">
            {/* Mensagens de Loading/Erro/Vazio */}
            {isLoading && <div className="flex-grow flex justify-center items-center"><LoadingSpinner /></div>}
            {error && <div className="flex-grow flex justify-center items-center text-center p-6 bg-red-900/20 text-red-400 border border-red-700 rounded-md">Erro: {error}</div>}
            {!isLoading && !error && chartData.length === 0 && (
                <div className="flex-grow flex justify-center items-center text-center p-10 text-dark-text-secondary">Nenhum dado encontrado para os filtros selecionados nesta página.</div>
            )}

            {/* Renderiza o Gráfico */}
            {!isLoading && !error && chartData.length > 0 && (
                 // [IMPORTANTE] Container do gráfico ocupa espaço restante
                <div className="flex-grow min-h-0">
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={options}
                        // Garante que o gráfico use 100% da altura e largura
                        containerProps={{ style: { height: "100%", width: "100%" } }}
                    />
                </div>
            )}

            {/* --- BOTÕES DE PAGINAÇÃO --- */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-auto pt-4 border-t border-dark-border">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={!canGoPrevious || isLoading}
                        aria-label="Página Anterior"
                        className={`p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${canGoPrevious
                                ? 'bg-accent-blue text-white hover:bg-blue-700'
                                : 'bg-gray-700 text-gray-500'
                            }`}
                    >
                        <FiChevronLeft size={20} />
                    </button>
                    <span className="text-sm text-dark-text-secondary">
                        Página {currentPage + 1} de {totalPages}
                    </span>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={!canGoNext || isLoading}
                        aria-label="Próxima Página"
                        className={`p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${canGoNext
                                ? 'bg-accent-blue text-white hover:bg-blue-700'
                                : 'bg-gray-700 text-gray-500'
                            }`}
                    >
                        <FiChevronRight size={20} />
                    </button>
                </div>
            )}
             {/* Adiciona espaço reservado se <= 1 página (mantém altura) */}
             {!isLoading && !error && totalPages <= 1 && (
                 <div className="h-[52px] border-t border-transparent"></div> 
             )}
        </div>
    );
};

export default SankeyChart;