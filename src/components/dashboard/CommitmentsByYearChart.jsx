// src/components/Dashboard/CommitmentsByYearChart.jsx
import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const CommitmentsByYearChart = ({ data }) => {
    const options = {
        chart: { type: 'column' },
        title: { text: 'Total de Financiamento por Ano' },
        xAxis: { categories: data.map(d => d.year), title: { text: 'Ano' } },
        yAxis: { title: { text: 'Valor (Milhares USD)' } },
        legend: { enabled: false },
        series: [{ name: 'Valor', data: data.map(d => d.amount) }]
    };

    return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default CommitmentsByYearChart;