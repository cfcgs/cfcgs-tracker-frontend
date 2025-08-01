import React, { useState, useEffect } from 'react';
import { getCommitmentsData } from '../../services/api';
import { FiDownload } from 'react-icons/fi';

const CommitmentCard = ({ year }) => {
    const [previewCommitments, setPreviewCommitments] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    // Efeito para buscar os dados de preview (apenas 5 itens)
    useEffect(() => {
        const fetchPreviewData = async () => {
            setLoading(true);
            try {
                // Pede 6 itens. Se a API retornar 6, sabemos que há mais para mostrar.
                const data = await getCommitmentsData({ selectedYears: [year], limit: 6 });
                setPreviewCommitments(data.slice(0, 5)); // Mostra apenas os 5 primeiros
                if (data.length > 5) {
                    setHasMore(true); // Se há mais de 5, ativa as reticências
                }
            } catch (error) {
                console.error(`Falha ao carregar preview para o ano ${year}:`, error);
            } finally {
                setLoading(false);
            }
        };
        fetchPreviewData();
    }, [year]); // Roda sempre que o ano mudar

    // Função de exportação que busca TODOS os dados do ano antes de baixar
    const exportToCsv = async () => {
        setExporting(true); // Ativa o estado de loading no botão
        try {
            // Busca os dados completos, com um limite bem grande, apenas sob demanda
            const allDataForYear = await getCommitmentsData({ selectedYears: [year], limit: 35000 });
            
            if (!allDataForYear || allDataForYear.length === 0) {
                alert(`Não há dados para exportar para o ano ${year}.`);
                return;
            }

            const headers = ['ID', 'Year', 'Project', 'Provider', 'Channel', 'Recipient', 'Amount (USD K)'];
            const escapeCsvCell = (cell) => {
                const str = String(cell ?? '');
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            };

            const rows = allDataForYear.map(c => 
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

        } catch (error) {
            console.error(`Falha ao exportar CSV para o ano ${year}:`, error);
            alert(`Ocorreu um erro ao gerar o arquivo CSV para ${year}.`);
        } finally {
            setExporting(false); // Desativa o estado de loading no botão
        }
    };

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-semibold text-dark-text">Compromissos de {year}</h4>
                <button 
                    onClick={exportToCsv} 
                    disabled={exporting}
                    className="bg-accent-blue text-white px-3 py-1 rounded-md flex items-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-wait"
                >
                    <FiDownload /> {exporting ? 'Exportando...' : 'Baixar CSV Completo'}
                </button>
            </div>
            <div className="overflow-auto max-h-80 custom-scrollbar">
                 {loading ? <div className="text-center p-4">Carregando prévia...</div> : (
                    <table className="w-full text-sm text-left text-dark-text-secondary">
                        <thead className="text-xs text-dark-text uppercase bg-gray-700/40 sticky top-0">
                            <tr>
                                <th className="px-4 py-2">Projeto (Prévia)</th>
                                <th className="px-4 py-2">País Receptor</th>
                                <th className="px-4 py-2 text-right">Valor (USD K)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                            {previewCommitments.map(c => (
                                <tr key={c.id} className="hover:bg-gray-700/20">
                                    <td className="px-4 py-2 truncate" title={c.project}>{c.project || '-'}</td>
                                    <td className="px-4 py-2">{c.recipient_country || '-'}</td>
                                    <td className="px-4 py-2 text-right">{c.amount_usd_thousand.toLocaleString('en-US')}</td>
                                </tr>
                            ))}
                        </tbody>
                        {hasMore && (
                            <tfoot>
                                <tr>
                                    <td colSpan="3" className="text-center py-2 text-dark-text-secondary">... e mais</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                 )}
            </div>
        </div>
    );
};

export default CommitmentCard;