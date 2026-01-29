// src/components/Dashboard/LineChart.jsx
import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

import "highcharts/modules/exporting";
import "highcharts/modules/offline-exporting";

const LineChart = ({ seriesData, title }) => {
    const options = {
        chart: {
            type: 'areaspline',
            events: {
                render() {
                    const btn = this.container?.querySelector('.highcharts-contextbutton');
                    if (btn) {
                        btn.setAttribute('data-tour', 'commitments-export');
                        if (!btn.dataset.tourExportHook) {
                            btn.dataset.tourExportHook = '1';
                            btn.addEventListener('click', () => {
                                setTimeout(() => {
                                    const menu = this.container?.querySelector('.highcharts-contextmenu');
                                    if (!menu) return;
                                    menu.querySelectorAll('.highcharts-menu-item').forEach((item) => {
                                        if (item.dataset.tourExportEvent === 'tour:export-commitments') return;
                                        item.dataset.tourExportEvent = 'tour:export-commitments';
                                        item.addEventListener('click', () => {
                                            document.dispatchEvent(new CustomEvent('tour:export-commitments'));
                                        });
                                    });
                                }, 0);
                            });
                        }
                    }
                    const menu = this.container?.querySelector('.highcharts-contextmenu');
                    if (menu) {
                        menu.querySelectorAll('.highcharts-menu-item').forEach((item) => {
                            if (item.dataset.tourExportEvent === 'tour:export-commitments') return;
                            item.dataset.tourExportEvent = 'tour:export-commitments';
                            item.addEventListener('click', () => {
                                document.dispatchEvent(new CustomEvent('tour:export-commitments'));
                            });
                        });
                    }
                }
            }
        },
        title: { text: title },
        xAxis: {
            type: 'category', // Anos
            title: { text: 'Ano' }
        },
        yAxis: {
            title: { text: 'Financiamento (Milhares USD)' }
        },
        tooltip: {
            shared: true,
            headerFormat: '<b>Ano: {point.key}</b><br>',
            pointFormat: '<span style="color:{series.color}">●</span> {series.name}: <b>${point.y:,.0f} K</b><br/>'
        },
        plotOptions: {
            areaspline: {
                fillOpacity: 0.2,
                marker: { enabled: false }
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

export default LineChart;
