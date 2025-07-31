// src/components/Dashboard/LineChart.jsx
import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const LineChart = ({ seriesData, title }) => {
    const options = {
        chart: { type: 'areaspline' },
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
        series: seriesData
    };

    return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default LineChart;