import React, { useEffect, useRef, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

import "highcharts/highcharts-more";
import "highcharts/modules/exporting";
import "highcharts/modules/offline-exporting";

const BarChart = ({ statusData }) => {
    if (!statusData) {
        return <div className="text-center p-10 text-dark-text-secondary">Selecione filtros para ver os dados.</div>;
    }

    const containerRef = useRef(null);
    const [chartHeight, setChartHeight] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const node = containerRef.current;
        if (!node) return undefined;

        const updateHeight = () => {
            if (isFullscreen) return;
            const nextHeight = node.clientHeight || 0;
            if (nextHeight && nextHeight !== chartHeight) {
                setChartHeight(nextHeight);
            }
        };

        updateHeight();

        const observer = new ResizeObserver(() => updateHeight());
        observer.observe(node);

        return () => observer.disconnect();
    }, [chartHeight, isFullscreen]);

    const { total_pledge, total_deposit, total_approval } = statusData;
    const colors = Highcharts.getOptions().colors;
    const maxValue = Math.max(total_pledge || 0, total_deposit || 0, total_approval || 0);
    const unitLabel = maxValue >= 1000 ? 'Valor (USD bi)' : 'Valor (USD mn)';
    const formatMillions = (value) => {
        if (value >= 1000) {
            return `${Highcharts.numberFormat(value / 1000, 1, ',', '.')} bi`;
        }
        return `${Highcharts.numberFormat(value, 1, ',', '.')} mn`;
    };

    const options = {
        chart: {
            type: 'bar',
            height: isFullscreen ? null : (chartHeight || null),
            events: {
                fullscreenOpen() {
                    setIsFullscreen(true);
                    this.update({ chart: { height: null } }, false);
                    setTimeout(() => {
                        this.setSize(null, null, false);
                        this.reflow();
                    }, 0);
                },
                fullscreenClose() {
                    setIsFullscreen(false);
                    this.update({ chart: { height: chartHeight || null } }, false);
                    setTimeout(() => {
                        this.setSize(null, chartHeight || null, false);
                        this.reflow();
                    }, 0);
                },
                render() {
                    const btn = this.container?.querySelector('.highcharts-contextbutton');
                    if (btn) {
                        btn.setAttribute('data-tour', 'status-export');
                        if (!btn.dataset.tourExportHook) {
                            btn.dataset.tourExportHook = '1';
                            btn.addEventListener('click', () => {
                                setTimeout(() => {
                                    const menu = this.container?.querySelector('.highcharts-contextmenu');
                                    if (!menu) return;
                                    menu.querySelectorAll('.highcharts-menu-item').forEach((item) => {
                                        if (item.dataset.tourExportEvent === 'tour:export-status') return;
                                        item.dataset.tourExportEvent = 'tour:export-status';
                                        item.addEventListener('click', () => {
                                            document.dispatchEvent(new CustomEvent('tour:export-status'));
                                        });
                                    });
                                }, 0);
                            });
                        }
                    }
                    const menu = this.container?.querySelector('.highcharts-contextmenu');
                    if (menu) {
                        menu.querySelectorAll('.highcharts-menu-item').forEach((item) => {
                            if (item.dataset.tourExportEvent === 'tour:export-status') return;
                            item.dataset.tourExportEvent = 'tour:export-status';
                            item.addEventListener('click', () => {
                                document.dispatchEvent(new CustomEvent('tour:export-status'));
                            });
                        });
                    }
                }
            }
        },
        title: {
            text: 'Status Financeiro dos Fundos' // Traduzido
        },
        xAxis: {
            // Categorias traduzidas
            categories: ['Promessas (Pledge)', 'Depósitos (Deposit)', 'Aprovações (Approval)'],
            title: {
                text: null
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: unitLabel, // Traduzido
                align: 'high'
            },
            labels: {
                overflow: 'justify',
                formatter: function () {
                    return formatMillions(this.value);
                }
            }
        },
        tooltip: {
            // Tooltip melhorado e traduzido
            formatter: function () {
                return `<b>${this.category}</b><br/>${this.series.name}: USD ${formatMillions(this.y)}`;
            }
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true,
                    formatter: function () {
                        return formatMillions(this.y);
                    }
                },
                borderRadius: 5,
            }
        },
        legend: {
            enabled: false,
        },
        series: [{
            name: 'Valor', // Traduzido
            data: [
                // Novas cores mais elegantes
                { y: total_pledge, color: colors[0] },   // Azul
                { y: total_deposit, color: colors[3] },  // Roxo/Azul
                { y: total_approval, color: colors[1] } // Verde
            ],
        }],
        exporting: {
            buttons: {
                contextButton: {
                    menuItems: ["viewFullscreen", "printChart", "separator", "downloadPNG", "downloadJPEG", "downloadPDF", "downloadSVG"]
                }
            }
        }
    };

    return (
        <div ref={containerRef} className="h-full w-full">
            <HighchartsReact
                highcharts={Highcharts}
                options={options}
                containerProps={{ style: { height: "100%", width: "100%" } }}
            />
        </div>
    );
};

export default BarChart;
