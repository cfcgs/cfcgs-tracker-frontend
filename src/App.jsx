// src/App.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './index.css';

import SideNav from './components/SideNav';
import DashboardPage from './pages/DashboardPage';
import DataGridPage from './pages/DataGridPage';
import ChatbotPage from './pages/ChatbotPage';
import { FiCompass, FiPause, FiPlay, FiX } from 'react-icons/fi';

import EcoBotSaudando from './images/EcoBotSaudando.png';
import EcoBotExplicando from './images/EcoBotExplicando.png';
import EcoBotFinalizando from './images/EcoBotFinalizando.png';

const ReportsPage = () => <div className="p-6 text-white text-3xl">Página de Relatórios (em construção)</div>;
const FundsPage = () => <div className="p-6 text-white text-3xl">Página de Fundos (em construção)</div>;
const UploadPage = () => <div className="p-6 text-white text-3xl">Página de Upload (em construção)</div>;

const parseEnvFlag = (value) => {
    if (!value) return false;
    return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const VIEW_LABELS = {
    dashboard: 'Dashboard',
    chatbot: 'Assistente IA',
    datagrid: 'Tabelas completas',
};

function App() {
    const [activeView, setActiveView] = useState('dashboard');
    const tutorialEnabled = parseEnvFlag(import.meta.env.VITE_TUTORIAL_ENABLED);
    const [tourActive, setTourActive] = useState(false);
    const [tourVisible, setTourVisible] = useState(false);
    const [tourPhase, setTourPhase] = useState(0);
    const [tourStepIndex, setTourStepIndex] = useState(0);
    const [tourTarget, setTourTarget] = useState(null);
    const [focusRect, setFocusRect] = useState(null);
    const [tourCompleted, setTourCompleted] = useState(false);
    const [stepCompleted, setStepCompleted] = useState(false);
    const [interactionMode, setInteractionMode] = useState(false);
    const [filterProgress, setFilterProgress] = useState({});
    const mainRef = useRef(null);

    const tourSteps = useMemo(() => ([
        {
            id: 'welcome',
            phase: 0,
            view: 'dashboard',
            selector: '[data-tour="nav-dashboard"]',
            title: 'Bem-vindo(a)!',
            text: 'Este tour rápido mostra as principais áreas da plataforma. Vamos começar pelo Dashboard.',
            image: EcoBotSaudando,
            placement: 'right',
            completion: { type: 'none' },
        },
        {
            id: 'heatmap-filters',
            phase: 0,
            view: 'dashboard',
            selector: '[data-tour="heatmap-filters"]',
            focusSelector: '[data-tour="heatmap-chart"]',
            title: 'Filtros do Heatmap',
            text: 'Use todos os filtros (anos, países, projetos, objetivo e visualização) para explorar os dados.',
            image: EcoBotExplicando,
            placement: 'bottom',
            completion: { type: 'filters', required: ['years', 'countries', 'projects', 'objective', 'view'] },
        },
        {
            id: 'heatmap-export',
            phase: 0,
            view: 'dashboard',
            selector: '[data-tour="heatmap-export"]',
            focusSelector: '[data-tour="heatmap-chart"]',
            title: 'Exportar Heatmap',
            text: 'Clique em “Exportar” para salvar o heatmap.',
            image: EcoBotExplicando,
            placement: 'left',
            completion: { type: 'event', eventName: 'tour:export-heatmap' },
        },
        {
            id: 'bubble-chart',
            phase: 1,
            view: 'dashboard',
            selector: '[data-tour="bubble-chart"]',
            focusSelector: '[data-tour="bubble-chart"]',
            title: 'Gráfico de Bolhas',
            text: 'Interaja com o gráfico e observe os pontos destacados.',
            image: EcoBotExplicando,
            placement: 'right',
            completion: { type: 'event', eventName: 'tour:bubble-tooltip' },
        },
        {
            id: 'bubble-filters',
            phase: 1,
            view: 'dashboard',
            selector: '[data-tour="bubble-filters"]',
            focusSelector: '[data-tour="bubble-chart"]',
            title: 'Filtros de Fundos',
            text: 'Selecione ao menos um Tipo e um Foco de fundo.',
            image: EcoBotExplicando,
            placement: 'bottom',
            completion: { type: 'filters', required: ['types', 'focuses'] },
        },
        {
            id: 'bubble-export',
            phase: 1,
            view: 'dashboard',
            selector: '[data-tour="bubble-export"]',
            focusSelector: '[data-tour="bubble-chart"]',
            title: 'Exportar Bubble',
            text: 'Use o botão de exportação do gráfico de bolhas.',
            image: EcoBotExplicando,
            placement: 'left',
            completion: { type: 'event', eventName: 'tour:export-bubble' },
        },
        {
            id: 'status-filters',
            phase: 1,
            view: 'dashboard',
            selector: '[data-tour="status-filters"]',
            focusSelector: '[data-tour="status-chart"]',
            title: 'Filtros de Status',
            text: 'Selecione Fundos, Tipos e Focos para o Status Financeiro Agregado.',
            image: EcoBotExplicando,
            placement: 'bottom',
            completion: { type: 'filters', required: ['funds', 'types', 'focuses'] },
        },
        {
            id: 'status-export',
            phase: 1,
            view: 'dashboard',
            selector: '[data-tour="status-export"]',
            focusSelector: '[data-tour="status-chart"]',
            title: 'Exportar Status',
            text: 'Use o botão de exportação deste gráfico.',
            image: EcoBotExplicando,
            placement: 'left',
            completion: { type: 'event', eventName: 'tour:export-status' },
        },
        {
            id: 'objective-filters',
            phase: 1,
            view: 'dashboard',
            selector: '[data-tour="objective-filters"]',
            focusSelector: '[data-tour="objective-chart"]',
            title: 'Filtros por Objetivo',
            text: 'Defina anos, países e objetivos climáticos.',
            image: EcoBotExplicando,
            placement: 'bottom',
            completion: { type: 'filters', required: ['years', 'countries', 'objectives'] },
        },
        {
            id: 'objective-export',
            phase: 1,
            view: 'dashboard',
            selector: '[data-tour="objective-export"]',
            focusSelector: '[data-tour="objective-chart"]',
            title: 'Exportar Objetivos',
            text: 'Use o botão de exportação do gráfico de objetivos.',
            image: EcoBotExplicando,
            placement: 'left',
            completion: { type: 'event', eventName: 'tour:export-objective' },
        },
        {
            id: 'commitments-filters',
            phase: 1,
            view: 'dashboard',
            selector: '[data-tour="commitments-filters"]',
            focusSelector: '[data-tour="commitments-chart"]',
            title: 'Filtros por País',
            text: 'Escolha anos e países receptores.',
            image: EcoBotExplicando,
            placement: 'bottom',
            completion: { type: 'filters', required: ['years', 'countries'] },
        },
        {
            id: 'commitments-export',
            phase: 1,
            view: 'dashboard',
            selector: '[data-tour="commitments-export"]',
            focusSelector: '[data-tour="commitments-chart"]',
            title: 'Exportar Evolução',
            text: 'Use o botão de exportação deste gráfico.',
            image: EcoBotExplicando,
            placement: 'left',
            completion: { type: 'event', eventName: 'tour:export-commitments' },
        },
        {
            id: 'chatbot',
            phase: 2,
            view: 'chatbot',
            selector: '[data-tour="chatbot-input"]',
            focusSelector: '[data-tour="chatbot-input"]',
            title: 'Assistente IA',
            text: 'Faça pelo menos uma pergunta ao assistente.',
            image: EcoBotExplicando,
            placement: 'top',
            completion: { type: 'event', eventName: 'tour:chatbot-response' },
        },
        {
            id: 'datagrid',
            phase: 2,
            view: 'datagrid',
            selector: '[data-tour="datagrid-download"]',
            focusSelector: '[data-tour="datagrid-download"]',
            title: 'Tabelas Completas',
            text: 'Acesse esta página e faça o download de uma tabela.',
            image: EcoBotExplicando,
            placement: 'left',
            completion: { type: 'click', selector: '[data-tour="datagrid-download"]' },
        },
        {
            id: 'finish',
            phase: 3,
            view: 'dashboard',
            selector: null,
            title: 'Tutorial concluído!',
            text: 'Você já conhece os principais recursos. Fique à vontade para explorar mais. O botão “Avaliar plataforma” está disponível para você clicar quando quiser.',
            image: EcoBotFinalizando,
            placement: 'center',
            completion: { type: 'none' },
        },
    ]), []);

    const totalPhases = useMemo(
        () => Math.max(...tourSteps.map((step) => step.phase)) + 1,
        [tourSteps],
    );

    const phaseSteps = useMemo(
        () => tourSteps.filter((step) => step.phase === tourPhase),
        [tourSteps, tourPhase],
    );

    useEffect(() => {
        if (tourStepIndex >= phaseSteps.length) {
            setTourStepIndex(0);
        }
    }, [phaseSteps, tourStepIndex]);

    const currentStep = tourActive && tourVisible ? phaseSteps[tourStepIndex] : null;
    const navSelectorByView = useMemo(
        () => ({
            dashboard: '[data-tour="nav-dashboard"]',
            chatbot: '[data-tour="nav-chatbot"]',
            datagrid: '[data-tour="nav-datagrid"]',
        }),
        [],
    );
    const stepNeedsNavigation = Boolean(currentStep?.view && currentStep.view !== activeView);
    const requiresCompletion = Boolean(
        currentStep?.completion && currentStep.completion.type !== 'none'
    );
    const canAdvanceStep = !stepNeedsNavigation && (!requiresCompletion || stepCompleted);

    useEffect(() => {
        if (!currentStep || stepNeedsNavigation || !currentStep.selector) return;
        const element = document.querySelector(currentStep.selector);
        if (!element) return;
        const timer = setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }, 150);
        return () => {
            clearTimeout(timer);
        };
    }, [currentStep, stepNeedsNavigation]);

    useEffect(() => {
        if (!currentStep) return;
        if (!requiresCompletion) {
            setStepCompleted(true);
            setInteractionMode(false);
            return;
        }
        setStepCompleted(false);
        setInteractionMode(false);
        setFilterProgress({});
    }, [currentStep?.id, requiresCompletion]);

    useEffect(() => {
        if (!currentStep) return;
        if (!stepNeedsNavigation && interactionMode) {
            setInteractionMode(false);
        }
    }, [stepNeedsNavigation, currentStep?.id]);

    useEffect(() => {
        if (!currentStep || stepNeedsNavigation || !requiresCompletion) return;
        const completion = currentStep.completion;
        const selector = completion?.selector || currentStep.selector;

        const handler = (event) => {
            if (completion.type === 'filters') {
                if (event.type !== 'tour:filter-change') return;
                const detail = event.detail || {};
                if (detail.stepId !== currentStep.id) return;
                setFilterProgress((prev) => {
                    const next = { ...prev, [detail.filter]: detail.filled };
                    const required = completion.required || [];
                    const allFilled = required.every((key) => next[key]);
                    if (allFilled) {
                        setStepCompleted(true);
                        setInteractionMode(false);
                    }
                    return next;
                });
                return;
            }

            if (completion.type === 'event') {
                if (event.type !== completion.eventName) return;
                setStepCompleted(true);
                setInteractionMode(false);
                return;
            }

            if (!selector) return;
            const target = event.target;
            if (!target?.closest) return;
            const match = target.closest(selector);
            if (!match) return;
            if (completion.type === 'click' && event.type !== 'click') return;
            if (completion.type === 'submit' && event.type !== 'submit') return;
            if (completion.type === 'change' && event.type !== 'change') return;
            if (completion.type === 'interact' && !['click', 'change', 'input'].includes(event.type)) return;
            if (completion.type === 'hover' && event.type !== 'mouseover') return;
            setStepCompleted(true);
            setInteractionMode(false);
        };

        document.addEventListener('click', handler, true);
        document.addEventListener('change', handler, true);
        document.addEventListener('input', handler, true);
        document.addEventListener('submit', handler, true);
        document.addEventListener('mouseover', handler, true);
        document.addEventListener('tour:filter-change', handler, true);
        if (completion.type === 'event' && completion.eventName) {
            document.addEventListener(completion.eventName, handler, true);
        }

        return () => {
            document.removeEventListener('click', handler, true);
            document.removeEventListener('change', handler, true);
            document.removeEventListener('input', handler, true);
            document.removeEventListener('submit', handler, true);
            document.removeEventListener('mouseover', handler, true);
            document.removeEventListener('tour:filter-change', handler, true);
            if (completion.type === 'event' && completion.eventName) {
                document.removeEventListener(completion.eventName, handler, true);
            }
        };
    }, [currentStep, requiresCompletion, stepNeedsNavigation]);

    useEffect(() => {
        if (!currentStep) {
            setTourTarget(null);
            setFocusRect(null);
            return;
        }

        let rafId = null;
        const updateTarget = () => {
            if (stepNeedsNavigation) {
                const navElement = document.querySelector(navSelectorByView[currentStep.view]);
                if (!navElement) {
                    setTourTarget(null);
                    setFocusRect(null);
                    return;
                }
                const navRect = navElement.getBoundingClientRect();
                setTourTarget(navRect);
                setFocusRect(navRect);
                return;
            }

            if (!currentStep.selector) {
                setTourTarget(null);
                setFocusRect(null);
                return;
            }
            const element = document.querySelector(currentStep.selector);
            if (!element) {
                setTourTarget(null);
                setFocusRect(null);
                return;
            }
            const rect = element.getBoundingClientRect();
            const focusElement = currentStep.focusSelector
                ? document.querySelector(currentStep.focusSelector)
                : element?.closest('[data-tour$="-chart"]') || element;
            const focusRectNext = focusElement ? focusElement.getBoundingClientRect() : rect;

            setTourTarget((prev) => {
                if (!prev) return rect;
                if (
                    prev.top === rect.top &&
                    prev.left === rect.left &&
                    prev.width === rect.width &&
                    prev.height === rect.height
                ) {
                    return prev;
                }
                return rect;
            });

            setFocusRect((prev) => {
                if (!prev) return focusRectNext;
                if (
                    prev.top === focusRectNext.top &&
                    prev.left === focusRectNext.left &&
                    prev.width === focusRectNext.width &&
                    prev.height === focusRectNext.height
                ) {
                    return prev;
                }
                return focusRectNext;
            });
        };

        const scheduleUpdate = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(updateTarget);
        };

        scheduleUpdate();
        window.addEventListener('resize', scheduleUpdate);
        window.addEventListener('scroll', scheduleUpdate, { passive: true });
        document.addEventListener('scroll', scheduleUpdate, true);

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            window.removeEventListener('resize', scheduleUpdate);
            window.removeEventListener('scroll', scheduleUpdate);
            document.removeEventListener('scroll', scheduleUpdate, true);
        };
    }, [currentStep?.id, stepNeedsNavigation]);

    const showTourPopup = Boolean(
        currentStep &&
        tourActive &&
        tourVisible &&
        !interactionMode &&
        (!currentStep.selector || stepNeedsNavigation || tourTarget)
    );
    const shouldBlockInteractions = Boolean(
        tourActive &&
        tourVisible &&
        requiresCompletion &&
        !stepNeedsNavigation &&
        !interactionMode
    );

    const bubbleStyle = useMemo(() => {
        if (!currentStep || stepNeedsNavigation || !tourTarget) {
            return {
                top: '18%',
                left: '50%',
                transform: 'translateX(-50%)',
            };
        }
        const offset = 16;
        const rect = tourTarget;
        const viewportWidth = typeof window !== 'undefined' ? (window.innerWidth || 1200) : 1200;
        const viewportHeight = typeof window !== 'undefined' ? (window.innerHeight || 800) : 800;
        const maxWidth = 440;
        const maxHeight = 320;

        const placements = {
            right: {
                top: rect.top + rect.height / 2,
                left: rect.right + offset,
                transform: 'translateY(-50%)',
            },
            left: {
                top: rect.top + rect.height / 2,
                left: Math.max(rect.left - offset - maxWidth, 12),
                transform: 'translateY(-50%)',
            },
            bottom: {
                top: rect.bottom + offset,
                left: rect.left + rect.width / 2,
                transform: 'translateX(-50%)',
            },
            top: {
                top: Math.max(rect.top - offset - maxHeight, 12),
                left: rect.left + rect.width / 2,
                transform: 'translateX(-50%)',
            },
            center: {
                top: '20%',
                left: '50%',
                transform: 'translateX(-50%)',
            },
        };

        let placement = placements[currentStep.placement] || placements.right;
        if (placement === placements.right && rect.right + offset + maxWidth > viewportWidth) {
            placement = placements.left;
        }
        if (placement === placements.left && rect.left - offset - maxWidth < 0) {
            placement = placements.right;
        }
        if (placement === placements.bottom && rect.bottom + offset + maxHeight > viewportHeight) {
            placement = placements.top;
        }
        if (placement === placements.top && rect.top - offset - maxHeight < 0) {
            placement = placements.bottom;
        }
        const left = Math.min(Math.max(12, placement.left), viewportWidth - maxWidth - 12);
        const top = Math.min(Math.max(12, placement.top), viewportHeight - maxHeight - 12);
        return { ...placement, left, top };
    }, [currentStep, stepNeedsNavigation, tourTarget]);

    const startTour = useCallback(() => {
        setTourActive(true);
        setTourVisible(true);
        setTourPhase(0);
        setTourStepIndex(0);
    }, []);

    const toggleTour = useCallback(() => {
        if (!tourActive) {
            startTour();
            return;
        }
        setTourVisible((prev) => !prev);
    }, [tourActive, startTour]);

    const handleTourPrev = useCallback(() => {
        setTourStepIndex((prev) => Math.max(prev - 1, 0));
    }, []);

    const handleTourNext = useCallback(() => {
        if (!currentStep) return;
        const isLastStep = tourStepIndex >= phaseSteps.length - 1;
        if (!isLastStep) {
            setTourStepIndex((prev) => prev + 1);
            return;
        }
        const isLastPhase = tourPhase >= totalPhases - 1;
        if (isLastPhase) {
            setTourActive(false);
            setTourVisible(false);
            setTourPhase(0);
            setTourStepIndex(0);
            setTourCompleted(true);
        } else {
            setTourVisible(false);
            setTourPhase((prev) => prev + 1);
            setTourStepIndex(0);
        }
    }, [currentStep, phaseSteps.length, tourPhase, totalPhases, tourStepIndex]);

    const handleTourClose = useCallback(() => {
        setTourVisible(false);
    }, []);

    const handleTryStep = useCallback(() => {
        setInteractionMode(true);
    }, []);

    const handleTourEnd = useCallback(() => {
        setTourActive(false);
        setTourVisible(false);
        setTourPhase(0);
        setTourStepIndex(0);
    }, []);

    const renderActiveView = () => {
        switch (activeView) {
            case 'dashboard':
                return <DashboardPage />;
            case 'datagrid':
                return <DataGridPage />;
            case 'reports':
                return <ReportsPage />;
            case 'funds':
                return <FundsPage />;
            case 'upload':
                return <UploadPage />;
            case 'chatbot':
                return <ChatbotPage />;
            default:
                return <DashboardPage />;
        }
    };

    const tutorialButtonLabel = tourActive
        ? tourVisible
            ? 'Pausar tutorial'
            : `Retomar tutorial (Etapa ${tourPhase + 1}/${totalPhases})`
        : 'Iniciar tutorial';

    const tutorialButtonIcon = tourActive
        ? tourVisible
            ? <FiPause className="text-lg" />
            : <FiPlay className="text-lg" />
        : <FiCompass className="text-lg" />;

    const focusBlockers = useMemo(() => [], []);

    return (
        <div className="relative flex min-h-screen bg-dark-bg text-dark-text">
            <SideNav
                activeView={activeView}
                onNavChange={setActiveView}
                footer={
                    tutorialEnabled ? (
                        <button
                            type="button"
                            onClick={toggleTour}
                            className="w-full flex items-center justify-center gap-2 rounded-full border border-accent-blue/40 bg-dark-card/90 px-4 py-3 text-sm font-semibold text-accent-blue shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition hover:bg-dark-card"
                        >
                            {tutorialButtonIcon}
                            {tutorialButtonLabel}
                        </button>
                    ) : null
                }
            />
            <main ref={mainRef} className="flex-1 overflow-y-auto">
                {renderActiveView()}
            </main>

            {tourCompleted && activeView === 'dashboard' && import.meta.env.VITE_EVALUATION_FORM_URL && (
                <button
                    type="button"
                    onClick={() => {
                        const url = import.meta.env.VITE_EVALUATION_FORM_URL;
                        window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                    className="fixed bottom-6 right-6 z-[70] rounded-full bg-accent-blue/90 px-1 py-1 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(88,166,255,0.35)] transition hover:opacity-95 animate-eval-pop"
                >
                    <span className="flex items-center gap-2 rounded-full border border-white/80 bg-accent-blue px-4 py-2">
                        Avaliar plataforma
                    </span>
                </button>
            )}

            {showTourPopup && (
                <>
                    {tourTarget && (
                        <div
                            className="fixed z-[60] rounded-2xl border-2 border-accent-blue/80 shadow-[0_0_24px_rgba(88,166,255,0.45)] pointer-events-none"
                            style={{
                                top: Math.max(tourTarget.top - 8, 0),
                                left: Math.max(tourTarget.left - 8, 0),
                                width: tourTarget.width + 16,
                                height: tourTarget.height + 16,
                                transition: 'none',
                            }}
                        />
                    )}
                    <div
                        key={currentStep.id}
                        className="fixed z-[75] w-[440px] max-w-[92vw] rounded-2xl border border-dark-border bg-dark-card/95 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.55)] animate-tour-drop"
                        style={{ ...bubbleStyle }}
                    >
                        <div className="flex items-start gap-4">
                            <img
                                src={currentStep.image}
                                alt="EcoBot"
                                className="h-32 w-32 flex-shrink-0"
                            />
                            <div className="flex-1">
                                <div className="text-xs uppercase tracking-[0.16em] text-accent-blue">
                                    Etapa {tourPhase + 1} de {totalPhases} · Passo {tourStepIndex + 1} de {phaseSteps.length}
                                </div>
                                <h4 className="mt-1 text-base font-semibold text-dark-text">{currentStep.title}</h4>
                                <p className="mt-2 text-sm text-dark-text-secondary">{currentStep.text}</p>
                                {requiresCompletion && stepCompleted && !stepNeedsNavigation && (
                                    <div className="mt-3 rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-xs text-green-200">
                                        Muito bem! Você concluiu a tarefa. Clique em “Próximo” para continuar.
                                    </div>
                                )}
                                {stepNeedsNavigation && (
                                    <div className="mt-3 rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-3 py-2 text-xs text-accent-blue">
                                        Use a barra lateral para ir para <strong>{VIEW_LABELS[currentStep.view] || currentStep.view}</strong> e continuar.
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleTourEnd}
                                    className="flex items-center gap-1 text-xs text-dark-text-secondary hover:text-dark-text"
                                >
                                    <FiX /> Encerrar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleTourClose}
                                    className="text-xs text-dark-text-secondary hover:text-dark-text"
                                >
                                    Ocultar
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                {requiresCompletion && !stepCompleted && (
                                    <button
                                        type="button"
                                        onClick={handleTryStep}
                                        className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white shadow-[0_8px_16px_rgba(34,197,94,0.35)] transition hover:opacity-90"
                                    >
                                        Tente você mesmo
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleTourPrev}
                                    disabled={tourStepIndex === 0}
                                    className="rounded-full border border-dark-border px-3 py-1 text-xs text-dark-text-secondary transition hover:text-dark-text disabled:opacity-40"
                                >
                                    Voltar
                                </button>
                                {!stepNeedsNavigation && (!requiresCompletion || stepCompleted) && (
                                    <button
                                        type="button"
                                        onClick={handleTourNext}
                                        disabled={!canAdvanceStep}
                                        className="rounded-full bg-accent-blue px-4 py-1 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {tourStepIndex === phaseSteps.length - 1
                                            ? tourPhase >= totalPhases - 1
                                                ? 'Finalizar'
                                                : 'Concluir etapa'
                                            : 'Próximo'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {shouldBlockInteractions && (
                <div className="fixed inset-0 z-[70] pointer-events-auto bg-transparent" />
            )}
        </div>
    );
}

export default App;
