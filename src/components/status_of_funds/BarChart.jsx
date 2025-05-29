import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

import "highcharts/highcharts-more";
import "highcharts/modules/exporting";
import "highcharts/modules/offline-exporting";


const BarChart = ({ statusData }) => {
    if (!statusData) {
        return <div className="text-center p-10 text-gray-500">Sem dados para exibir no gráfico de status.</div>;
    }

    const { total_pledge, total_deposit, total_approval } = statusData;

    const options = {
        chart: {
            type: 'bar',
            height: 700,
        },
        title: {
            text: 'Financial status of funds'
        },
        xAxis: {
            categories: ['Pledge', 'Deposit', 'Approval'],
            title: {
                text: null
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Value (USD)', // Ajuste a unidade conforme necessário
                align: 'high'
            },
            labels: {
                overflow: 'justify',
                formatter: function () { // Formata para milhões com 'M'
                    return (this.value / 1000).toFixed(1) + 'K';
                }
            }
        },
        tooltip: {
            valueSuffix: ' USD', // Ajuste a unidade conforme necessário
            formatter: function () {
                return `<b>${this.category}</b><br/>${this.series.name}: ${Highcharts.numberFormat(this.y, 2, '.', ',')} USD`;
            }
        },
        plotOptions: {
            bar: {
                dataLabels: {
                    enabled: true,
                    formatter: function () {
                        return Highcharts.numberFormat(this.y / 1000, 1) + 'K'; // Mostra em milhões
                    }
                },
                borderRadius: 3,
            }
        },
        legend: {
            enabled: false,
        },
        credits: {
            enabled: false
        },
        series: [{
            name: 'Valor',
            data: [
                { y: total_pledge, color: '#7cb5ec' },   // Azul para Pledge
                { y: total_deposit, color: '#434348' },  // Cinza Escuro para Deposit
                { y: total_approval, color: '#90ed7d' } // Verde para Approval
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
