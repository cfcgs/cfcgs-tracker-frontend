import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

import "highcharts/highcharts-more";
import "highcharts/modules/exporting";
import "highcharts/modules/offline-exporting";

const BarChart = ({ statusData }) => {
    if (!statusData) {
        return <div className="text-center p-10 text-dark-text-secondary">Selecione filtros para ver os dados.</div>;
    }

    const { total_pledge, total_deposit, total_approval } = statusData;
    const colors = Highcharts.getOptions().colors;

    const options = {
        chart: {
            type: 'bar',
            height: 700,
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
                text: 'Valor (USD)', // Traduzido
                align: 'high'
            },
            labels: {
                overflow: 'justify',
                formatter: function () {
                    if (this.value >= 1000000) return (this.value / 1000000).toFixed(1) + ' bi';
                    if (this.value >= 1000) return (this.value / 1000).toFixed(1) + ' mi';
                    return this.value;
                }
            }
        },
        tooltip: {
            // Tooltip melhorado e traduzido
            formatter: function () {
                return `<b>${this.category}</b><br/>${this.series.name}: ${Highcharts.numberFormat(this.y, 2, '.', ',')} USD`;
            }
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true,
                    formatter: function () {
                        if (this.y >= 1000000) return Highcharts.numberFormat(this.y / 1000000, 1) + ' bi';
                        if (this.y >= 1000) return Highcharts.numberFormat(this.y / 1000, 1) + ' mi';
                        return Highcharts.numberFormat(this.y, 0);
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
        <div className="chart-container">
            <HighchartsReact
                highcharts={Highcharts}
                options={options}
                containerProps={{ style: { height: "100%", width: "100%" } }}
            />
        </div>
    );
};

export default BarChart;