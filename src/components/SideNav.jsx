import React from 'react';
import { FiGrid, FiMenu, FiMessageSquare, FiShield, FiTable, FiX } from 'react-icons/fi';

const SideNav = ({
    activeView,
    onNavChange,
    footer,
    showAdminEntry = false,
    isMobileOpen = false,
    onOpenMobile,
    onCloseMobile,
}) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <FiGrid />, tour: 'nav-dashboard' },
        { id: 'datagrid', label: 'Tabelas Completas', icon: <FiTable />, tour: 'nav-datagrid' },
        { id: 'chatbot', label: 'Assistente CFC-GS', icon: <FiMessageSquare />, tour: 'nav-chatbot' },
    ];

    if (showAdminEntry) {
        navItems.push({ id: 'admin', label: 'Gestão da Plataforma', icon: <FiShield />, tour: 'nav-admin' });
    }

    const renderNavContent = () => (
        <>
            <div className="mb-8 flex items-center justify-between">
                <div className="text-2xl font-bold text-white">
                    CFC-GS <span className="text-accent-blue">Tracker</span>
                </div>
                <button
                    type="button"
                    onClick={onCloseMobile}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-dark-border bg-dark-card text-dark-text-secondary transition hover:border-accent-blue/30 hover:text-white md:hidden"
                    aria-label="Fechar menu"
                >
                    <FiX size={18} />
                </button>
            </div>
            <ul className="flex flex-col space-y-2">
                {navItems.map(item => (
                    <li key={item.id}>
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onNavChange(item.id);
                            }}
                            className={`flex items-center p-3 rounded-lg transition-colors
                                ${activeView === item.id
                                    ? 'bg-accent-blue text-white'
                                    : 'text-dark-text-secondary hover:bg-gray-700 hover:text-white'}`}
                            data-tour={item.tour}
                        >
                            <span className="mr-3 text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                        </a>
                    </li>
                ))}
            </ul>
            {footer && <div className="mt-auto pt-6">{footer}</div>}
        </>
    );

    return (
        <>
            <button
                type="button"
                onClick={onOpenMobile}
                className="fixed left-4 top-4 z-[95] inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-dark-border bg-dark-card/95 text-dark-text shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur md:hidden"
                aria-label="Abrir menu"
                data-tour="mobile-nav-toggle"
            >
                <FiMenu size={20} />
            </button>

            <div
                className={`fixed inset-0 z-[90] bg-[#02060d]/70 backdrop-blur-sm transition-all duration-300 md:hidden ${
                    isMobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                }`}
                onClick={onCloseMobile}
            />

            <aside
                className={`fixed inset-y-0 left-0 z-[100] flex w-[84vw] max-w-[320px] flex-col border-r border-dark-border bg-dark-card/95 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur transition-transform duration-300 ease-out md:hidden ${
                    isMobileOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {renderNavContent()}
            </aside>

            <nav className="sticky top-0 hidden h-screen w-64 flex-col border-r border-dark-border bg-dark-card p-4 md:flex">
                {renderNavContent()}
            </nav>
        </>
    );
};

export default SideNav;
