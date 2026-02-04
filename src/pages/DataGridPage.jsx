import React, { useState, useEffect, useRef } from 'react';
import { getFundsData, getAvailableYears } from '../services/api';
import DataGrid from '../components/fund_data_table/DataGrid';
import CommitmentCard from '../components/datagrid/CommitmentCard'; // Importe o novo componente
import { FiDownload } from 'react-icons/fi';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DataGridPage = () => {
    const [funds, setFunds] = useState([]);
    const [availableYears, setAvailableYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const gridRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Carga inicial agora é super leve!
                const [fundsData, yearsData] = await Promise.all([
                    getFundsData(),
                    getAvailableYears()
                ]);
                setFunds(fundsData || []);
                setAvailableYears(yearsData || []);
            } catch (error) {
                console.error("Falha ao carregar dados da página de tabelas:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const exportFundsToCsv = () => {
        if (!funds || funds.length === 0) return;
        const headers = ['Fund Name', 'Type', 'Focus', 'Pledge (USD)', 'Deposit (USD)', 'Approval (USD)', 'Disbursement (USD)', 'Approved Projects'];
        const rows = funds.map(f => [
            f.fund_name, f.fund_type, f.fund_focus, f.pledge, f.deposit,
            f.approval, f.disbursement, f.projects_approved
        ].map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','));
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `funds_detailed_table.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-4 md:p-6">
            <h2 className="text-3xl font-bold mb-6 text-dark-text">Tabelas de Dados Detalhadas</h2>
            
            <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-8">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-dark-text">Tabela Detalhada de Fundos</h3>
                    <button
                        onClick={exportFundsToCsv}
                        className="bg-accent-blue text-white px-3 py-1 rounded-md flex items-center gap-2 hover:opacity-80 transition-opacity"
                        data-tour="datagrid-download"
                    >
                        <FiDownload /> Baixar CSV Completo
                    </button>
                </div>
                 <div className="h-[600px] table-scroll-wrapper">
                    <DataGrid data={funds} ref={gridRef} />
                 </div>
            </div>

            <div>
                <h3 className="text-2xl font-bold mb-4 text-dark-text">Compromissos por Ano</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {availableYears
                        .sort((a, b) => b - a)
                        .map((year) => (
                            <CommitmentCard key={year} year={year} />
                        ))}
                </div>
            </div>
        </div>
    );
};

export default DataGridPage;
