// src/pages/ChatbotPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiUser, FiCpu } from 'react-icons/fi'; // Ícones para usuário e bot
import LoadingSpinner from '../components/common/LoadingSpinner';
import { askChatbot } from '../services/api'; // Importa a função da API

const ChatbotPage = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        // Mensagem inicial do bot
        { sender: 'bot', text: 'Olá! Sou seu assistente de dados climáticos. Como posso ajudar com informações sobre fundos, projetos ou financiamentos?' }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // [NOVO] Estados para controle da confirmação de LIMIT
    const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
    const [originalQuestion, setOriginalQuestion] = useState(''); // Guarda a pergunta original
    const messagesEndRef = useRef(null); // Ref para o final da lista de mensagens

    // Efeito para rolar para o final quando novas mensagens chegam
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Função para verificar se a resposta do bot é uma sugestão de LIMIT
    const isLimitSuggestion = (text) => {
        if (typeof text !== 'string') return false;
        const lowerText = text.toLowerCase();
        // Heurística: Procura por frases comuns na sugestão do prompt do backend
        return (lowerText.includes("consulta pode levar um tempo") || lowerText.includes("pode demorar")) &&
               lowerText.includes("primeiros") &&
               lowerText.includes("resultados?");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const currentInput = input.trim();
        if (!currentInput || loading) return;

        const userMessage = { sender: 'user', text: currentInput };
        // Adiciona mensagem do usuário E limpa estado de confirmação anterior
        setMessages(prevMessages => [...prevMessages, userMessage]);
        setIsAwaitingConfirmation(false); // Cancela espera se usuário digitou algo novo
        setOriginalQuestion(''); // Limpa pergunta original guardada
        setInput(''); 
        setLoading(true); 
        setError(null); 

        try {
            const botAnswer = await askChatbot(userMessage.text);
            const botMessage = { sender: 'bot', text: botAnswer };

            // Verifica se a resposta é uma sugestão de LIMIT
            if (isLimitSuggestion(botAnswer)) {
                setIsAwaitingConfirmation(true); // Ativa modo de espera por confirmação
                setOriginalQuestion(userMessage.text); // Guarda a pergunta original
            }
            
            setMessages(prevMessages => [...prevMessages, botMessage]); 
        } catch (err) {
            console.error("Erro ao chamar o chatbot:", err);
            const errorMessage = { sender: 'bot', text: 'Desculpe, não consegui processar sua pergunta. Tente novamente.' };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
            setError('Falha na comunicação com o assistente.'); 
        } finally {
            setLoading(false); 
        }
    };

    // [NOVO] Handler para quando o usuário clica em "Sim, mostrar limitados"
    const handleConfirmation = async () => {
        if (!originalQuestion || loading) return;

        // Cria a nova pergunta instruindo o bot a usar LIMIT (ex: 10)
        const confirmationPrompt = `Ok, por favor mostre os primeiros 10 resultados para a pergunta: "${originalQuestion}"`;
        
        const confirmationMessage = { sender: 'user', text: confirmationPrompt };
        
        // Adiciona a "mensagem de confirmação" ao chat, limpa estados
        setMessages(prevMessages => [...prevMessages, confirmationMessage]);
        setIsAwaitingConfirmation(false);
        setOriginalQuestion('');
        setLoading(true);
        setError(null);

        try {
            // Envia a nova pergunta (com instrução de LIMIT) para o bot
            const botAnswer = await askChatbot(confirmationPrompt);
            const botMessage = { sender: 'bot', text: botAnswer };
            setMessages(prevMessages => [...prevMessages, botMessage]); 
        } catch (err) {
            console.error("Erro ao chamar o chatbot após confirmação:", err);
            const errorMessage = { sender: 'bot', text: 'Desculpe, tive um problema ao buscar os resultados limitados.' };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
            setError('Falha na comunicação com o assistente.'); 
        } finally {
            setLoading(false); 
        }
    };

    // [NOVO] Handler para quando o usuário clica em "Não" ou quer refazer
    const handleRejection = () => {
         setIsAwaitingConfirmation(false);
         setOriginalQuestion('');
         // Opcional: Adicionar mensagem do bot tipo "Ok, como posso ajudar então?"
         // const rejectionResponseMessage = { sender: 'bot', text: 'Entendido. Por favor, reformule sua pergunta ou peça outra informação.' };
         // setMessages(prevMessages => [...prevMessages, rejectionResponseMessage]);
         // Focar no input novamente pode ser útil
         // inputRef.current?.focus(); 
    };

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
                             {typeof msg.text === 'string' ? (
                                 msg.text.split('\n').map((line, i, arr) => (
                                     <React.Fragment key={i}>
                                         {line || '\u00A0'} {/* Renderiza espaço se linha vazia */}
                                         {i < arr.length - 1 && <br />} {/* Adiciona <br> exceto na última linha */}
                                     </React.Fragment>
                                 ))
                             ) : (
                                 'Resposta inválida' // Fallback
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

            {/* [NOVO] Botões de Confirmação */}
            {isAwaitingConfirmation && !loading && (
                <div className="flex justify-center gap-4 mb-4">
                    <button
                        onClick={handleConfirmation}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                    >
                        Sim, mostrar primeiros 10
                    </button>
                    <button
                        onClick={handleRejection}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                    >
                        Não, refazer pergunta
                    </button>
                </div>
            )}

            {/* Área de Input */}
            <form onSubmit={handleSubmit} className="flex items-center gap-3 border-t border-dark-border pt-4">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isAwaitingConfirmation ? "Responda à sugestão acima ou digite uma nova pergunta..." : "Pergunte sobre os dados de financiamento..."}
                    className="flex-grow px-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue text-white placeholder-gray-500 disabled:opacity-50"
                    disabled={loading} // Desabilita input durante loading
                    // ref={inputRef} // Opcional: para focar após rejeição
                />
                <button
                    type="submit"
                    // Desabilita se loading OU se esperando confirmação E input está vazio
                    disabled={loading || (isAwaitingConfirmation && !input.trim()) || (!isAwaitingConfirmation && !input.trim())} 
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