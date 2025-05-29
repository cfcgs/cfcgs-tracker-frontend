import React, { useEffect, useRef, forwardRef } from 'react'; 
import { Grid } from '@highcharts/grid-lite';

const transformDataForGrid = (apiData) => {
    if (!apiData || apiData.length === 0) return {};
    const columns = {
        'Fund Name': [], 'Type': [], 'Focus': [], 'Pledge (USD)': [],
        'Disbursement (USD)': [], 'Deposit (USD)': [], 'Approval (USD)': [],
        'Approved Projects': [],
    };
    apiData.forEach(fund => {
        columns['Fund Name'].push(fund.fund_name);
        columns['Type'].push(fund.fund_type);
        columns['Focus'].push(fund.fund_focus);
        columns['Pledge (USD)'].push(parseFloat(fund.pledge) || 0);
        columns['Disbursement (USD)'].push(parseFloat(fund.disbursement) || 0);
        columns['Deposit (USD)'].push(parseFloat(fund.deposit) || 0);
        columns['Approval (USD)'].push(parseFloat(fund.approval) || 0);
        columns['Approved Projects'].push(parseInt(fund.projects_approved, 10) || 0);
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
          'Pledge': {
              cellFormatter: (cell) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cell.value)
          },
          'Disbursement': {
              cellFormatter: (cell) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cell.value)
          },
          'Approval': {
              cellFormatter: (cell) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cell.value)
          },
          'Deposit': {
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
    return <div className="text-center p-4">No data available.</div>;
  }

  // Este div recebe a ref do pai e é preenchido pelo Highcharts DataGrid
  return <div ref={ref} className="grid-lite-table-wrapper" />; // A classe aqui é para o estilo
});

export default DataGrid;