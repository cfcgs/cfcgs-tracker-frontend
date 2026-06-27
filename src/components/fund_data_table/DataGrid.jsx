import React, { useEffect, useRef, forwardRef } from 'react'; 
import { Grid } from '@highcharts/grid-lite';

const transformDataForGrid = (apiData) => {
    if (!apiData || apiData.length === 0) return {};
    const columns = {
        'Provedor de Financiamento': [], 'Tipo': [], 'Foco': [], 'Compromisso (USD)': [],
        'Desembolso (USD)': [], 'Depósito (USD)': [], 'Aprovação (USD)': [],
        'Projetos Aprovados': [],
    };
    apiData.forEach(fund => {
        columns['Provedor de Financiamento'].push(fund.funding_provider_name);
        columns['Tipo'].push(fund.fund_type);
        columns['Foco'].push(fund.fund_focus);
        columns['Compromisso (USD)'].push(parseFloat(fund.pledge) || 0);
        columns['Desembolso (USD)'].push(parseFloat(fund.disbursement) || 0);
        columns['Depósito (USD)'].push(parseFloat(fund.deposit) || 0);
        columns['Aprovação (USD)'].push(parseFloat(fund.approval) || 0);
        columns['Projetos Aprovados'].push(parseInt(fund.projects_approved, 10) || 0);
    });
    return columns;
};

const DataGrid = forwardRef(({ data }, ref) => {

  const gridInstanceRef = useRef(null);

  useEffect(() => {
    // 'ref.current' será o div renderizado abaixo
    if (ref && ref.current && data && data.length > 0) {
      const transformedData = transformDataForGrid(data);

      gridInstanceRef.current = Grid.grid(ref.current, { // Usa ref.current como o contentor
        dataTable: {
          columns: transformedData,
        },
        sort: {
            enabled: true,
            sortDirection: 'asc'
        },
        columns: {
          'Compromisso (USD)': {
              cellFormatter: (cell) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cell.value)
          },
          'Desembolso (USD)': {
              cellFormatter: (cell) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cell.value)
          },
          'Aprovação (USD)': {
              cellFormatter: (cell) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cell.value)
          },
          'Depósito (USD)': {
              cellFormatter: (cell) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cell.value)
          },
          'Projetos Aprovados': {
              cellFormatter: (cell) => new Intl.NumberFormat('en-US').format(cell.value)
          }
        }
      });
    }

    return () => {
      if (gridInstanceRef.current) {
        gridInstanceRef.current.destroy();
        gridInstanceRef.current = null;
      }
    };
  }, [data, ref]); // Adiciona ref às dependências

  if (!data || data.length === 0) {
    return <div className="text-center p-4">Nenhum dado disponível.</div>;
  }

  // Este div recebe a ref do pai e é preenchido pelo Highcharts DataGrid
  return <div ref={ref} className="grid-lite-table-wrapper" />; // A classe aqui é para o estilo
});

export default DataGrid;