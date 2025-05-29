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
      text: 'Climate Funds Overview'
    },
    subtitle: {
      text: 'Bubble size represents pledge amount (USD mn)'
    },
    xAxis: {
      title: {
        text: 'Projects Approved'
      },
      labels: {
        format: '{value}'
      }
    },
    yAxis: {
      title: {
        text: 'Disbursement (USD mn)'
      },
      labels: {
        format: '{value}'
      }
    },
    tooltip: {
      useHTML: true,
      headerFormat: '<table>',
      pointFormat: '<tr><th colspan="2"><h3>{point.name}</h3></th></tr>' +
        '<tr><th>Pledge:</th><td>${point.z:.3f} mn</td></tr>' +
        '<tr><th>Disbursement:</th><td>${point.y:.3f} mn</td></tr>' +
        '<tr><th>Projects Approved:</th><td>{point.x}</td></tr>' +
        '<tr><th>Fund Type:</th><td>{point.fund_type}</td></tr>' +
        '<tr><th>Fund Focus:</th><td>{point.fund_focus}</td></tr>',
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
      name: 'Funds',
      colorByPoint: true,
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