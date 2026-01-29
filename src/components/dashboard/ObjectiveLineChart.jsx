// src/components/Dashboard/ObjectiveLineChart.jsx
import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

import "highcharts/modules/exporting";
import "highcharts/modules/offline-exporting";

const ObjectiveLineChart = ({ seriesData }) => {
    const options = {
        chart: {
            type: 'line',
            events: {
                render() {
                    const btn = this.container?.querySelector('.highcharts-contextbutton');
                    if (btn) {
                        btn.setAttribute('data-tour', 'objective-export');
                        if (!btn.dataset.tourExportHook) {
                            btn.dataset.tourExportHook = '1';
                            btn.addEventListener('click', () => {
                                setTimeout(() => {
                                    const menu = this.container?.querySelector('.highcharts-contextmenu');
                                    if (!menu) return;
                                    menu.querySelectorAll('.highcharts-menu-item').forEach((item) => {
                                        if (item.dataset.tourExportEvent === 'tour:export-objective') return;
                                        item.dataset.tourExportEvent = 'tour:export-objective';
                                        item.addEventListener('click', () => {
                                            document.dispatchEvent(new CustomEvent('tour:export-objective'));
                                        });
                                    });
                                }, 0);
                            });
                        }
                    }
                    const menu = this.container?.querySelector('.highcharts-contextmenu');
                    if (menu) {
                        menu.querySelectorAll('.highcharts-menu-item').forEach((item) => {
                            if (item.dataset.tourExportEvent === 'tour:export-objective') return;
                            item.dataset.tourExportEvent = 'tour:export-objective';
                            item.addEventListener('click', () => {
                                document.dispatchEvent(new CustomEvent('tour:export-objective'));
                            });
                        });
                    }
                }
            }
        },
        title: { text: null },
        xAxis: {
            type: 'category',
            title: { text: 'Ano' }
        },
        yAxis: {
            title: { text: 'Valor (Milhares USD)' }
        },
        tooltip: {
            shared: true,
            headerFormat: '<b>Ano: {point.key}</b><br>',
            pointFormat: '<span style="color:{series.color}">●</span> {series.name}: <b>${point.y:,.0f} K</b><br/>'
        },
        plotOptions: {
            line: {
                marker: {
                    enabled: true,
                    radius: 3
                }
            }
        },
        series: seriesData,
        exporting: {
            buttons: {
                contextButton: {
                    menuItems: ["viewFullscreen", "printChart", "separator", "downloadPNG", "downloadJPEG", "downloadPDF", "downloadSVG"]
                }
            }
        }
    };

    return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default ObjectiveLineChart;
