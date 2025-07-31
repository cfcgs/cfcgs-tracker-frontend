// src/components/Dashboard/ObjectiveLineChart.jsx
import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const ObjectiveLineChart = ({ seriesData }) => {
    const options = {
        chart: { type: 'line' },
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
        series: seriesData
    };

    return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default ObjectiveLineChart;