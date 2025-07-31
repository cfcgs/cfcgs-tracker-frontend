import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getFundsData, getCommitmentsData } from '../services/api';
import DataGrid from '../components/fund_data_table/DataGrid';
import { FiDownload } from 'react-icons/fi';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CommitmentCard = ({ year, commitments }) => {
    const escapeCsvCell = (cell) => {
        const str = String(cell ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const exportToCsv = () => {
        if (!commitments || commitments.length === 0) return;
        const headers = ['ID', 'Year', 'Project', 'Provider', 'Channel', 'Recipient', 'Amount (USD K)'];
        const rows = commitments.map(c => 
            [c.id, c.year, c.project, c.provider_country, c.channel_of_delivery, c.recipient_country, c.amount_usd_thousand]
            .map(escapeCsvCell)
            .join(',')
        );
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `commitments_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-semibold text-dark-text">Compromissos de {year}</h4>
                <button onClick={exportToCsv} className="bg-accent-blue text-white px-3 py-1 rounded-md flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <FiDownload /> Baixar CSV
                </button>
            </div>
            <div className="overflow-auto max-h-80 custom-scrollbar">
                 <table className="w-full text-sm text-left text-dark-text-secondary">
                    <thead className="text-xs text-dark-text uppercase bg-gray-700/40 sticky top-0">
                        <tr>
                            <th className="px-4 py-2">Projeto</th>
                            <th className="px-4 py-2">País Receptor</th>
                            <th className="px-4 py-2 text-right">Valor (USD K)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                        {commitments.slice(0, 5).map(c => (
                            <tr key={c.id} className="hover:bg-gray-700/20">
                                <td className="px-4 py-2 truncate" title={c.project}>{c.project || '-'}</td>
                                <td className="px-4 py-2">{c.recipient_country || '-'}</td>
                                <td className="px-4 py-2 text-right">{c.amount_usd_thousand.toLocaleString('en-US')}</td>
                            </tr>
                        ))}
                    </tbody>
                    {commitments.length > 5 && (
                        <tfoot>
                            <tr>
                                <td colSpan="3" className="text-center py-2 text-dark-text-secondary">...</td>
                            </tr>
                        </tfoot>
                    )}
                 </table>
            </div>
        </div>
    );
};

const DataGridPage = () => {
    const [funds, setFunds] = useState([]);
    const [commitments, setCommitments] = useState([]);
    const [loading, setLoading] = useState(true);
    const gridRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [fundsData, commitmentsData] = await Promise.all([
                    getFundsData(),
                    getCommitmentsData()
                ]);
                setFunds(fundsData || []);
                setCommitments(commitmentsData || []);
            } catch (error) {
                console.error("Falha ao carregar dados da tabela:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const commitmentsByYear = useMemo(() => {
        return commitments.reduce((acc, curr) => {
            (acc[curr.year] = acc[curr.year] || []).push(curr);
            return acc;
        }, {});
    }, [commitments]);

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
                    <button onClick={exportFundsToCsv} className="bg-accent-blue text-white px-3 py-1 rounded-md flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <FiDownload /> Baixar CSV
                    </button>
                </div>
                 <div className="h-[600px] table-scroll-wrapper">
                    <DataGrid data={funds} ref={gridRef} />
                 </div>
            </div>

            <div>
                <h3 className="text-2xl font-bold mb-4 text-dark-text">Compromissos por Ano</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(commitmentsByYear)
                        .sort(([yearA], [yearB]) => parseInt(yearB) - parseInt(yearA))
                        .map(([year, data]) => (
                            <CommitmentCard key={year} year={year} commitments={data} />
                        ))}
                </div>
            </div>
        </div>
    );
};

export default DataGridPage;