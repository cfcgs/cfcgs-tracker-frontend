import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

import "highcharts/highcharts-more";
import "highcharts/modules/exporting";
import "highcharts/modules/offline-exporting";

const BubbleChart = ({ fundsData }) => {
  // Process data for the bubble chart
  const processData = () => {
    return fundsData.map(fund => ({
      name: fund.fund_name,
      x: fund.projects_approved,
      y: fund.disbursement,
      z: fund.pledge,
      fund_type: fund.fund_type,
      fund_focus: fund.fund_focus
    }));
  };

  const options = {
    chart: {
      type: 'bubble',
      plotBorderWidth: 1,
      zoomType: 'xy',
      height: 700
    },
    title: {
      text: 'Visão Geral dos Fundos Climáticos' // Traduzido
    },
    subtitle: {
      text: 'O tamanho da bolha representa o valor da promessa (Pledge) em Milhões de USD' // Traduzido
    },
    xAxis: {
      title: {
        text: 'Projetos Aprovados' // Traduzido
      },
      labels: {
        format: '{value}'
      }
    },
    yAxis: {
      title: {
        text: 'Desembolso (Milhões de USD)' // Traduzido
      },
      labels: {
        format: '{value}'
      }
    },
    tooltip: {
      useHTML: true,
      headerFormat: '<table>',
      // Tooltip traduzido
      pointFormat: '<tr><th colspan="2"><h3>{point.name}</h3></th></tr>' +
        '<tr><th>Promessa (Pledge):</th><td>${point.z:,.2f} mi</td></tr>' +
        '<tr><th>Desembolso:</th><td>${point.y:,.2f} mi</td></tr>' +
        '<tr><th>Projetos Aprovados:</th><td>{point.x}</td></tr>' +
        '<tr><th>Tipo de Fundo:</th><td>{point.fund_type}</td></tr>' +
        '<tr><th>Foco do Fundo:</th><td>{point.fund_focus}</td></tr>',
      footerFormat: '</table>',
      followPointer: true
    },
    plotOptions: {
      bubble: {
        minSize: 10,
        maxSize: 80,
        zMin: 0,
        zMax: 15000,
        dataLabels: {
          enabled: false
        }
      }
    },
    series: [{
      name: 'Fundos', // Traduzido
      colorByPoint: true, // Usará a nova paleta de cores do tema automaticamente
      data: processData()
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
      />
    </div>
  );
};

export default BubbleChart;