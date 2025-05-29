// src/components/DataTablePage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { getFundsData } from '../../services/api';
import DataGrid from './DataGrid'; // O seu componente que usa @highcharts/grid-lite

// Importações para exportação
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const DataTablePage = () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ref para o DIV que contém o DataGrid.
  // O DataGrid renderiza a sua tabela dentro deste div.
  const gridWrapperRef = useRef(null);

  useEffect(() => {
    const fetchDataForTable = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getFundsData(null, 500); // Busca mais dados
        setTableData(data || []);
      } catch (err) {
        setError('Falha ao carregar os dados da tabela.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDataForTable();
  }, []);

  // --- Funções de Exportação ---

  const getRenderedTableElement = () => {
    // O @highcharts/grid-lite provavelmente renderiza uma <table> dentro do div de referência.
    // Inspecione o DOM para confirmar a estrutura exata ou a classe da tabela.
    // Geralmente, é a primeira ou única tabela dentro do contentor.
    if (gridWrapperRef.current) {
      return gridWrapperRef.current.querySelector('table'); // Tenta encontrar a tabela
    }
    return null;
  };

  const exportToPdf = () => {
    const table = getRenderedTableElement();
    if (table) {
      const doc = new jsPDF();
      autoTable(doc, { html: table });
      doc.save('tabela-fundos.pdf');
    } else {
      alert("Tabela não encontrada para exportar para PDF.");
    }
  };

  const exportToImage = (format) => {
    const tableElement = getRenderedTableElement();
    if (tableElement) {
      // Para a imagem, capturamos o div wrapper para um melhor aspeto
      // (pode incluir padding, bordas do wrapper, etc.)
      // ou o próprio tableElement se preferir.
      const elementToCapture = gridWrapperRef.current || tableElement;
      html2canvas(elementToCapture).then(canvas => {
        const link = document.createElement('a');
        link.download = `tabela-fundos.${format}`;
        link.href = canvas.toDataURL(`image/${format}`, 1.0);
        link.click();
      });
    } else {
      alert(`Tabela não encontrada para exportar para ${format.toUpperCase()}.`);
    }
  };

  const escapeCsvCell = (cellData) => {
    if (cellData === null || cellData === undefined) {
      return '';
    }
    const stringData = String(cellData);
    // Se a célula contém vírgula, aspas ou quebra de linha, coloca entre aspas duplas
    if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
      return `"${stringData.replace(/"/g, '""')}"`; // Escapa aspas duplas internas
    }
    return stringData;
  };

  const exportToCsv = () => {
    if (!tableData || tableData.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    const headers = [
      'Fund Name', 'Type', 'Focus', 'Pledge (USD)', 'Disbursement (USD)',
      'Deposit (USD)', 'Approval (USD)', 'Approved Projects'
    ];
    const csvRows = [headers.join(',')]; // Linha do cabeçalho

    tableData.forEach(fund => {
      const row = [
        escapeCsvCell(fund.fund_name),
        escapeCsvCell(fund.fund_type),
        escapeCsvCell(fund.fund_focus),
        escapeCsvCell(fund.pledge),
        escapeCsvCell(fund.disbursement),
        escapeCsvCell(fund.deposit),
        escapeCsvCell(fund.approval),
        escapeCsvCell(fund.projects_approved),
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'tabela-fundos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="table-page-container"> {/* O seu contentor de 70% centralizado */}
      <div className="flex justify-between items-center mb-6">
        <div className="table-title">
          <h2 className="text-2xl font-bold text-gray-800">Funds Detail Table</h2>
        </div>
      </div>
      
      {/* O wrapper para o scroll e onde o grid-lite renderiza */}
      <div className="table-scroll-wrapper">
        {loading && <div className="loading-message">A carregar dados...</div>}
        {error && <div className="error-message">{error}</div>}
        {!loading && !error && (
          // Passamos a ref para o DataGrid para que ele possa anexá-la ao seu contentor
          // O DataGrid agora usa esta ref no seu div mais externo.
          <DataGrid data={tableData} ref={gridWrapperRef} />
        )}
      </div>
      <div className="table-export"> {/* flex-wrap para mobile */}
        <button onClick={exportToCsv} className="export-button">Exportar CSV</button>
      </div>
    </div>
  );
};

export default DataTablePage;