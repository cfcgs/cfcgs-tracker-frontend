import React, { useEffect, useRef, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

import "highcharts/highcharts-more";
import "highcharts/modules/exporting";
import "highcharts/modules/offline-exporting";

const BubbleChart = ({ fundsData }) => {
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
            btn.setAttribute('data-tour', 'bubble-export');
            if (!btn.dataset.tourExportHook) {
              btn.dataset.tourExportHook = '1';
              btn.addEventListener('click', () => {
                setTimeout(() => {
                  const menu = this.container?.querySelector('.highcharts-contextmenu');
                  if (menu) {
                    menu.querySelectorAll('.highcharts-menu-item').forEach((item) => {
                      if (item.dataset.tourExportEvent === 'tour:export-bubble') return;
                      item.dataset.tourExportEvent = 'tour:export-bubble';
                      item.addEventListener('click', () => {
                        document.dispatchEvent(new CustomEvent('tour:export-bubble'));
                      });
                    });
                  }
                }, 0);
              });
            }
          }
          const menu = this.container?.querySelector('.highcharts-contextmenu');
          if (menu) {
            menu.querySelectorAll('.highcharts-menu-item').forEach((item) => {
              if (item.dataset.tourExportEvent === 'tour:export-bubble') return;
              item.dataset.tourExportEvent = 'tour:export-bubble';
              item.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('tour:export-bubble'));
              });
            });
          }
        }
      }
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
        },
        point: {
          events: {
            mouseOut() {
              document.dispatchEvent(new CustomEvent('tour:bubble-tooltip'));
            }
          }
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
    <div ref={containerRef} className="h-full w-full">
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        containerProps={{ style: { height: "100%", width: "100%" } }}
      />
    </div>
  );
};

export default BubbleChart;
