import React, { useState, useEffect } from 'react';
import { getCommitmentsData } from '../../services/api';
import { FiDownload } from 'react-icons/fi';

const CommitmentCard = ({ year }) => {
    const [previewCommitments, setPreviewCommitments] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false); // Adicionado para feedback no botão

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
    }, [year]);

    // Função de exportação que chama o endpoint do backend
    const exportToCsv = () => {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
        // Simplesmente abre a URL do novo endpoint de exportação.
        // O navegador cuidará do download automaticamente.
        window.location.href = `${API_BASE_URL}/commitments/export/${year}`;
    };

    return (
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-semibold text-dark-text">Compromissos de {year}</h4>
                <button 
                    onClick={exportToCsv}
                    className="bg-accent-blue text-white px-3 py-1 rounded-md flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    <FiDownload /> Baixar CSV Completo
                </button>
            </div>
            {/* --- CÓDIGO DE RENDERIZAÇÃO RESTAURADO --- */}
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