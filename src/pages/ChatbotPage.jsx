// src/pages/ChatbotPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiCpu } from 'react-icons/fi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { askChatbot } from '../services/api';

const DEFAULT_PAGE_SIZE = 10;

const MARKDOWN_PATTERN = /(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g;

const parseMarkdownLine = (line) => {
    const tokens = [];
    let lastIndex = 0;
    let match;
    MARKDOWN_PATTERN.lastIndex = 0;

    while ((match = MARKDOWN_PATTERN.exec(line)) !== null) {
        const matchText = match[0];
        const matchIndex = match.index;
        if (matchIndex > lastIndex) {
            tokens.push({ type: 'text', value: line.slice(lastIndex, matchIndex) });
        }

        if (matchText.startsWith('`')) {
            tokens.push({ type: 'code', value: matchText.slice(1, -1) });
        } else if (matchText.startsWith('***')) {
            tokens.push({ type: 'bold_italic', value: matchText.slice(3, -3) });
        } else if (matchText.startsWith('**')) {
            tokens.push({ type: 'bold', value: matchText.slice(2, -2) });
        } else if (matchText.startsWith('__')) {
            tokens.push({ type: 'bold', value: matchText.slice(2, -2) });
        } else if (matchText.startsWith('*')) {
            tokens.push({ type: 'italic', value: matchText.slice(1, -1) });
        } else if (matchText.startsWith('_')) {
            tokens.push({ type: 'italic', value: matchText.slice(1, -1) });
        } else if (matchText.startsWith('[')) {
            const linkMatch = matchText.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
                tokens.push({ type: 'link', value: linkMatch[1], href: linkMatch[2] });
            } else {
                tokens.push({ type: 'text', value: matchText });
            }
        } else {
            tokens.push({ type: 'text', value: matchText });
        }

        lastIndex = matchIndex + matchText.length;
    }

    if (lastIndex < line.length) {
        tokens.push({ type: 'text', value: line.slice(lastIndex) });
    }

    return tokens;
};

const renderMarkdown = (text) => {
    return text.split('\n').map((line, lineIndex, lines) => (
        <React.Fragment key={`line-${lineIndex}`}>
            {line === '' && '\u00A0'}
            {parseMarkdownLine(line).map((token, tokenIndex) => {
                const key = `token-${lineIndex}-${tokenIndex}`;
                if (token.type === 'bold') {
                    return <strong key={key}>{token.value}</strong>;
                }
                if (token.type === 'italic') {
                    return <em key={key}>{token.value}</em>;
                }
                if (token.type === 'bold_italic') {
                    return <strong key={key}><em>{token.value}</em></strong>;
                }
                if (token.type === 'code') {
                    return (
                        <code key={key} className="rounded bg-dark-bg/60 px-1 py-0.5 text-[12px] text-accent-blue">
                            {token.value}
                        </code>
                    );
                }
                if (token.type === 'link') {
                    return (
                        <a
                            key={key}
                            href={token.href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent-blue underline-offset-2 hover:underline"
                        >
                            {token.value}
                        </a>
                    );
                }
                return <React.Fragment key={key}>{token.value}</React.Fragment>;
            })}
            {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
    ));
};

const ChatbotPage = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Olá! Sou seu assistente de dados climáticos. Como posso ajudar com informações sobre fundos, projetos ou financiamentos?' }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
    const [pendingPaginationQuestion, setPendingPaginationQuestion] = useState(null);
    const [activePagination, setActivePagination] = useState(null);
    const messagesEndRef = useRef(null);
    const sessionIdRef = useRef(null);

    if (!sessionIdRef.current) {
        const cryptoApi = typeof window !== 'undefined' ? window.crypto : undefined;
        sessionIdRef.current = cryptoApi?.randomUUID
            ? cryptoApi.randomUUID()
            : `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
    const sessionId = sessionIdRef.current;

    // Efeito para rolar para o final quando novas mensagens chegam
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const formatCellValue = (value) => {
        if (value === null || value === undefined) return '\u2014';
        if (typeof value === 'number') {
            return value.toLocaleString('pt-BR');
        }
        return String(value);
    };

    const renderPaginationTable = (pagination) => {
        if (!pagination) return null;
        const rows = pagination.rows || [];
        if (rows.length === 0) {
            return <p className="text-sm text-gray-400 mt-2">Nenhum registro nesta página.</p>;
        }
        const columns = Object.keys(rows[0] || {});
        return (
            <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                    <thead className="uppercase tracking-wide text-gray-400 bg-gray-800/60">
                        <tr>
                            {columns.map((col) => (
                                <th key={col} className="px-3 py-2 whitespace-nowrap">{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b border-dark-border last:border-b-0">
                                {columns.map((col) => (
                                    <td key={col} className="px-3 py-2 text-white whitespace-nowrap">
                                        {formatCellValue(row[col])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const handleBotResponse = (response, baseQuestion) => {
        const safeAnswer = response?.answer || 'Desculpe, não consegui processar sua pergunta.';
        const botMessage = {
            sender: 'bot',
            text: safeAnswer,
            pagination: response?.pagination || null,
            sources: response?.sources || null,
        };
        setMessages(prev => [...prev, botMessage]);

        if (response?.pagination && baseQuestion) {
            setActivePagination({
                question: baseQuestion,
                page: response.pagination.page,
                pageSize: response.pagination.page_size,
                totalRows: response.pagination.total_rows,
                hasMore: response.pagination.has_more,
            });
        } else if (!response?.needs_pagination_confirmation) {
            setActivePagination(null);
        }

        if (response?.needs_pagination_confirmation) {
            setIsAwaitingConfirmation(true);
            if (baseQuestion) {
                setPendingPaginationQuestion(baseQuestion);
            }
        } else {
            setIsAwaitingConfirmation(false);
            // Manter pendingPaginationQuestion se activePagination existir, caso contrário limpar.
            if (!activePagination) {
                setPendingPaginationQuestion(null);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const currentInput = input.trim();
        if (!currentInput || loading) return;

        const userMessage = { sender: 'user', text: currentInput };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setError(null);
        setActivePagination(null);
        setIsAwaitingConfirmation(false);
        setPendingPaginationQuestion(null);
        setLoading(true);

        try {
            const response = await askChatbot({
                question: currentInput,
                sessionId,
                page: 1,
                pageSize: DEFAULT_PAGE_SIZE,
                confirmPagination: false,
            });
            handleBotResponse(response, currentInput);
        } catch (err) {
            console.error('Erro ao chamar o chatbot:', err);
            const errorMessage = { sender: 'bot', text: 'Desculpe, não consegui processar sua pergunta. Tente novamente.' };
            setMessages(prev => [...prev, errorMessage]);
            setError('Falha na comunicação com o assistente.');
            setIsAwaitingConfirmation(false);
            setPendingPaginationQuestion(null);
            setActivePagination(null);
        } finally {
            setLoading(false);
        }
    };

    const requestPaginatedData = async ({ targetPage, userLabel, baseQuestion }) => {
        if (!baseQuestion) return;
        const sanitizedPage = Math.max(1, targetPage);
        const userText = userLabel || `Página ${sanitizedPage}`;

        // 1. Adiciona a mensagem do usuário/botão ao histórico
        setMessages(prev => [...prev, { sender: 'user', text: userText }]);
        setLoading(true);
        setError(null);

        try {
            const response = await askChatbot({
                // [CORREÇÃO AQUI] Passa a pergunta original do contexto PENDENTE
                question: baseQuestion, 
                sessionId,
                page: sanitizedPage,
                pageSize: DEFAULT_PAGE_SIZE,
                confirmPagination: true,
            });
            handleBotResponse(response, baseQuestion);
        } catch (err) {
            console.error('Erro ao buscar resultados paginados:', err);
            const errorMessage = { sender: 'bot', text: 'Desculpe, tive um problema ao buscar os resultados paginados.' };
            setMessages(prev => [...prev, errorMessage]);
            setError('Falha na comunicação com o assistente.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmation = () => {
        if (!pendingPaginationQuestion || loading) return;
        setIsAwaitingConfirmation(false);
        requestPaginatedData({
            targetPage: 1,
            userLabel: 'Sim, mostrar paginado',
            baseQuestion: pendingPaginationQuestion,
        });
        // [CORREÇÃO AQUI] Limpa o estado pendente após a confirmação para que a próxima 
        // pergunta do usuário não seja tratada como confirmação de paginação.
        setPendingPaginationQuestion(null);
    };

    const handleRejection = () => {
        if (!pendingPaginationQuestion) return;
        setMessages(prev => [
            ...prev,
            { sender: 'user', text: 'Não, obrigado.' },
            { sender: 'bot', text: 'Tudo bem, podemos tentar outra consulta quando desejar.' },
        ]);
        setIsAwaitingConfirmation(false);
        setPendingPaginationQuestion(null);
        setActivePagination(null);
    };

    const handlePageChange = (direction) => {
        if (!activePagination || loading) return;
        const targetPage = direction === 'next'
            ? activePagination.page + 1
            : Math.max(1, activePagination.page - 1);
        if (targetPage === activePagination.page) return;

        const userLabel = direction === 'next'
            ? `Próxima página (${targetPage})`
            : `Página anterior (${targetPage})`;

        requestPaginatedData({
            targetPage,
            userLabel,
            baseQuestion: activePagination.question,
        });
    };

    const totalRowsLabel = typeof activePagination?.totalRows === 'number'
        ? activePagination.totalRows.toLocaleString('pt-BR')
        : 'desconhecido';

    return (
        <div className="flex flex-col h-screen bg-dark-bg text-dark-text p-4 md:p-6">
            <h2 className="text-3xl font-bold mb-6 text-white">Assistente IA de Dados Climáticos</h2>
            
            {/* Área de Mensagens */}
            <div className="flex-grow overflow-y-auto mb-4 pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {/* Ícone do Bot */}
                        {msg.sender === 'bot' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-blue flex items-center justify-center text-white mt-1 shadow-md">
                                <FiCpu size={18} />
                            </div>
                        )}
                        
                        {/* Balão de Mensagem */}
                        <div 
                            className={`max-w-xl lg:max-w-3xl px-4 py-3 rounded-xl shadow-md break-words ${ // break-words para evitar overflow
                                msg.sender === 'user' 
                                ? 'bg-accent-blue text-white rounded-br-none' 
                                : 'bg-dark-card text-dark-text rounded-bl-none'
                            }`}
                        >
                             {/* Formata quebras de linha vindas do backend */}
                             {typeof msg.text === 'string'
                                 ? renderMarkdown(msg.text)
                                 : 'Resposta inválida'}

                             {msg.pagination && (
                                 <div className="mt-3">
                                     <p className="text-xs text-gray-400 mb-1">
                                         Página {msg.pagination.page} • {msg.pagination.page_size} por página • Total {msg.pagination.total_rows ?? 'desconhecido'}
                                     </p>
                                     {renderPaginationTable(msg.pagination)}
                                 </div>
                             )}

                             {msg.sender === 'bot' && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                                 <div className="mt-3 text-[11px] text-dark-text-secondary">
                                     Fonte:{' '}
                                     {msg.sources.map((source, sourceIndex) => (
                                         <React.Fragment key={`${source.url}-${sourceIndex}`}>
                                             {sourceIndex > 0 && ' · '}
                                             <a
                                                 href={source.url}
                                                 target="_blank"
                                                 rel="noreferrer"
                                                 className="text-accent-blue hover:underline"
                                             >
                                                 {source.name}
                                             </a>
                                         </React.Fragment>
                                     ))}
                                 </div>
                             )}
                        </div>
                    </div>
                ))}
                {/* Indicador de Loading */}
                {loading && (
                    <div className="flex items-start gap-3 justify-start">
                         <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-blue flex items-center justify-center text-white mt-1 shadow-md">
                            <FiCpu size={18} />
                         </div>
                         <div className="max-w-xs px-4 py-3 rounded-xl shadow bg-dark-card text-dark-text rounded-bl-none">
                            <LoadingSpinner size="sm" text="Pensando..." />
                         </div>
                    </div>
                )}
                {/* Elemento para scroll */}
                <div ref={messagesEndRef} />
            </div>

             {/* Mensagem de Erro (Opcional) */}
             {error && <div className="text-red-400 text-sm mb-2 text-center">{error}</div>}

            {activePagination?.question && (
                <div className="bg-dark-card border border-dark-border rounded-lg p-3 mb-4 text-sm text-white">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <p className="font-medium">
                            Resultados paginados para: <span className="text-accent-blue">{activePagination.question}</span>
                        </p>
                        <p>
                            Página {activePagination.page} • {activePagination.pageSize} por página • Total {totalRowsLabel}
                        </p>
                    </div>
                    <div className="flex justify-center gap-3 mt-3">
                        <button
                            onClick={() => handlePageChange('prev')}
                            disabled={loading || activePagination.page === 1}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            Página anterior
                        </button>
                        <button
                            onClick={() => handlePageChange('next')}
                            disabled={loading || !activePagination.hasMore}
                            className="px-4 py-2 bg-accent-blue hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            Próxima página
                        </button>
                    </div>
                </div>
            )}

            {/* [NOVO] Botões de Confirmação */}
            {isAwaitingConfirmation && !loading && (
                <div className="flex justify-center gap-4 mb-4">
                    <button
                        onClick={handleConfirmation}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                    >
                        Sim, mostrar paginado
                    </button>
                    <button
                        onClick={handleRejection}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                    >
                        Não, encerrar pergunta
                    </button>
                </div>
            )}

            {/* Área de Input */}
            <form onSubmit={handleSubmit} className="flex items-center gap-3 border-t border-dark-border pt-4">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isAwaitingConfirmation ? 'Responda usando os botões acima para continuar...' : 'Pergunte sobre os dados de financiamento...'}
                    className="flex-grow px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue text-white placeholder-gray-500 disabled:opacity-50"
                    disabled={loading || isAwaitingConfirmation}
                />
                <button
                    type="submit"
                    disabled={loading || isAwaitingConfirmation || !input.trim()}
                    className="p-3 bg-accent-blue text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    aria-label="Enviar mensagem"
                >
                    <FiSend size={20} />
                </button>
            </form>
        </div>
    );
};

export default ChatbotPage;
