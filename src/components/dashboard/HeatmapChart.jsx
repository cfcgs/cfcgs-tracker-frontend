// src/components/dashboard/HeatmapChart.jsx
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsHeatmap from 'highcharts/modules/heatmap';
import HighchartsExporting from 'highcharts/modules/exporting';
import HighchartsOfflineExporting from 'highcharts/modules/offline-exporting';
import LoadingSpinner from '../common/LoadingSpinner';
import { getHeatmapCellProjects, getHeatmapData } from '../../services/api';

// let highchartsModulesReady = false;
// const ensureHighchartsModules = () => {
//     if (highchartsModulesReady) {
//         return;
//     }
//     if (typeof Highcharts === 'object') {
//         HighchartsHeatmap(Highcharts);
//         HighchartsExporting(Highcharts);
//         HighchartsOfflineExporting(Highcharts);
//     }
//     highchartsModulesReady = true;
// };

// ensureHighchartsModules();

const CELL_SIZE = 36;
const CELL_WIDTH = CELL_SIZE;
const ROW_HEIGHT = CELL_SIZE;
const HEADER_HEIGHT = 36;
const COUNTRY_HEADER_HEIGHT = 120;
const LABEL_WIDTH = 200;
const TOTAL_WIDTH = 200;
const PROJECT_PAGE_SIZE = 30;
const PREFETCH_BUFFER = 2;
const MAX_ROW_LIMIT = 60;
const MAX_COLUMN_LIMIT = 40;
const DEFAULT_ROW_LIMIT = 20;
const DEFAULT_COLUMN_LIMIT = 12;

const formatNumber = (value) => new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 0,
}).format(value || 0);

const formatPercent = (value) => {
    if (!value || value <= 0) {
        return '';
    }
    if (value < 0.01) {
        return '<0.01%';
    }
    if (value < 0.1) {
        return `${value.toFixed(2)}%`;
    }
    if (value < 1) {
        return `${value.toFixed(1)}%`;
    }
    if (value < 10) {
        return `${value.toFixed(1)}%`;
    }
    return `${value.toFixed(0)}%`;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const formatObjective = (objectiveValue) => {
    if (objectiveValue === 'adaptation') {
        return 'Adaptação';
    }
    if (objectiveValue === 'mitigation') {
        return 'Mitigação';
    }
    if (objectiveValue === 'both') {
        return 'Ambos';
    }
    return 'N/A';
};

const SkeletonCell = ({ left, top }) => (
    <div
        className="absolute"
        style={{ left, top, width: CELL_WIDTH, height: ROW_HEIGHT }}
    >
        <div className="flex h-full w-full items-center justify-center rounded-[2px] border border-dark-border/60 bg-dark-bg/40">
            <div className="h-1.5 w-2/3 rounded-full bg-dark-border/70 animate-pulse" />
        </div>
    </div>
);

const HeatmapChart = ({ filters, loadingFilters }) => {
    const {
        years = [],
        country_ids: countryIds = [],
        project_ids: projectIds = [],
        objective = 'all',
        view = 'country_year',
    } = filters || {};

    const isCountryColumns = view !== 'country_year';
    const headerHeight = isCountryColumns ? COUNTRY_HEADER_HEIGHT : HEADER_HEIGHT;

    const containerRef = useRef(null);
    const scrollRef = useRef(null);
    const viewportRef = useRef(null);
    const chartRef = useRef(null);
    const tooltipRef = useRef(null);
    const tooltipPinnedRef = useRef(false);
    const hideTooltipTimeoutRef = useRef(null);
    const scrollRafRef = useRef(null);
    const cacheRef = useRef(new Map());
    const inflightRef = useRef(new Map());
    const activeLoadRef = useRef(0);

    const [viewport, setViewport] = useState({ width: 0, height: 0 });
    const [limits, setLimits] = useState({
        rowLimit: DEFAULT_ROW_LIMIT,
        columnLimit: DEFAULT_COLUMN_LIMIT,
    });
    const [limitsReady, setLimitsReady] = useState(false);
    const [scrollTop, setScrollTop] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [rowOffset, setRowOffset] = useState(0);
    const [columnOffset, setColumnOffset] = useState(0);
    const [sliceData, setSliceData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [tooltip, setTooltip] = useState(null);
    const [tooltipSize, setTooltipSize] = useState({ width: 0, height: 0 });
    const [pinnedKey, setPinnedKey] = useState(null);
    const [showProjects, setShowProjects] = useState(false);
    const [projectState, setProjectState] = useState({
        key: null,
        projects: [],
        total: 0,
        hasMore: false,
        loading: false,
        error: null,
    });

    const filterKey = useMemo(() => JSON.stringify({
        years,
        countryIds,
        projectIds,
        objective,
        view,
    }), [years, countryIds, projectIds, objective, view]);

    const rows = sliceData?.rows || [];
    const columns = sliceData?.columns || [];
    const rowTotals = sliceData?.row_totals || [];
    const columnTotals = sliceData?.column_totals || [];
    const cells = sliceData?.cells || [];
    const rowCount = sliceData?.row_count || rows.length || 0;
    const columnCount = sliceData?.column_count || columns.length || 0;

    const gridWidth = Math.max(columnCount, columns.length, 1) * CELL_WIDTH;
    const gridHeight = Math.max(rowCount, rows.length, 1) * ROW_HEIGHT;

    const displayRowOffset = sliceData?.row_offset ?? rowOffset;
    const displayColumnOffset = sliceData?.column_offset ?? columnOffset;

    const { rowLimit, columnLimit } = limits;

    const maxColorValue = useMemo(() => {
        return cells.reduce((max, cell) => {
            const value = Math.log10((cell.total_amount || 0) + 1);
            return value > max ? value : max;
        }, 0);
    }, [cells]);

    const cellMap = useMemo(() => {
        const map = new Map();
        cells.forEach((cell) => {
            map.set(`${cell.year}-${cell.country_id}`, cell);
        });
        return map;
    }, [cells]);

    const rowMeta = useMemo(() => rowTotals.map((row) => ({
        label: row.label ?? '',
        countryId: row.country_id ?? null,
        year: row.year ?? null,
        projectCount: row.project_count ?? 0,
        totalAmount: row.total_amount ?? 0,
        percentOfTotal: row.percent_of_total ?? 0,
    })), [rowTotals]);

    const columnMeta = useMemo(() => columnTotals.map((column) => ({
        label: column.label ?? '',
        countryId: column.country_id ?? null,
        year: column.year ?? null,
        projectCount: column.project_count ?? 0,
        totalAmount: column.total_amount ?? 0,
        percentOfTotal: column.percent_of_total ?? 0,
    })), [columnTotals]);

    const points = useMemo(() => {
        if (!rowMeta.length || !columnMeta.length) {
            return [];
        }

        const dataPoints = [];
        rowMeta.forEach((row, y) => {
            columnMeta.forEach((column, x) => {
                const year = view === 'country_year' ? column.year : row.year;
                const countryId = view === 'country_year' ? row.countryId : column.countryId;
                const cellKey = `${year}-${countryId}`;
                const cell = cellMap.get(cellKey);

                const rowLabel = view === 'country_year' ? row.label : String(row.year);
                const columnLabel = view === 'country_year' ? String(column.year) : column.label;
                const countryName = cell?.country_name || (view === 'country_year' ? row.label : column.label);

                const custom = cell || {
                    year: year ?? 0,
                    country_id: countryId ?? 0,
                    country_name: countryName,
                    row_label: rowLabel,
                    column_label: columnLabel,
                    total_amount: 0,
                    adaptation_exclusive: 0,
                    mitigation_exclusive: 0,
                    overlap: 0,
                    project_count: 0,
                    percent_of_total: 0,
                    percent_of_row: 0,
                    percent_of_column: 0,
                };

                const colorValue = Math.log10((custom.total_amount || 0) + 1);

                dataPoints.push({
                    x,
                    y,
                    value: colorValue,
                    custom,
                });
            });
        });

        return dataPoints;
    }, [cellMap, columnMeta, rowMeta, view]);

    const tooltipKey = tooltip
        ? `${tooltip.cell.year}-${tooltip.cell.country_id}-${objective}`
        : null;

    const clearTooltip = useCallback(() => {
        setTooltip(null);
        setShowProjects(false);
        tooltipPinnedRef.current = false;
    }, []);

    const getTooltipKeyFromCell = useCallback((cell) => {
        if (!cell) {
            return null;
        }
        return `${cell.year}-${cell.country_id}-${objective}`;
    }, [objective]);

    const getAnchorFromRect = useCallback((rect) => {
        const boundsElement = containerRef.current || viewportRef.current;
        const boundsRect = boundsElement?.getBoundingClientRect();
        if (!boundsRect) {
            return null;
        }
        if (!rect) {
            return null;
        }

        return {
            anchorX: rect.left + rect.width / 2 - boundsRect.left,
            anchorTop: rect.top - boundsRect.top,
            anchorBottom: rect.bottom - boundsRect.top,
        };
    }, []);

    const getAnchorFromPoint = useCallback((point) => {
        const graphicRect = point.graphic?.element?.getBoundingClientRect?.();
        if (graphicRect) {
            return getAnchorFromRect(graphicRect);
        }
        const chart = point.series?.chart;
        const shapeArgs = point.shapeArgs;
        if (!chart || !shapeArgs) {
            return null;
        }
        const chartPosition = chart.pointer?.getChartPosition?.() || chart.pointer?.chartPosition;
        if (!chartPosition) {
            return null;
        }
        const plotLeft = chart.plotLeft || 0;
        const plotTop = chart.plotTop || 0;
        const left = chartPosition.left + plotLeft + shapeArgs.x;
        const top = chartPosition.top + plotTop + shapeArgs.y;
        return getAnchorFromRect({
            left,
            top,
            width: shapeArgs.width,
            height: shapeArgs.height,
            right: left + shapeArgs.width,
            bottom: top + shapeArgs.height,
        });
    }, [getAnchorFromRect]);

    const updateOffsets = useCallback((nextScrollTop, nextScrollLeft) => {
        if (!rowCount || !columnCount) {
            return;
        }

        const maxRowOffset = Math.max(rowCount - rowLimit, 0);
        const maxColumnOffset = Math.max(columnCount - columnLimit, 0);

        const nextRowOffset = clamp(Math.floor(nextScrollTop / ROW_HEIGHT) - PREFETCH_BUFFER, 0, maxRowOffset);
        const nextColumnOffset = clamp(Math.floor(nextScrollLeft / CELL_WIDTH) - PREFETCH_BUFFER, 0, maxColumnOffset);

        if (nextRowOffset !== rowOffset) {
            setRowOffset(nextRowOffset);
        }
        if (nextColumnOffset !== columnOffset) {
            setColumnOffset(nextColumnOffset);
        }
    }, [columnCount, columnLimit, rowCount, rowLimit, rowOffset, columnOffset]);

    const handleScroll = useCallback((event) => {
        if (scrollRafRef.current) {
            return;
        }
        const target = event.target;
        scrollRafRef.current = requestAnimationFrame(() => {
            scrollRafRef.current = null;
            setScrollTop(target.scrollTop || 0);
            setScrollLeft(target.scrollLeft || 0);
            updateOffsets(target.scrollTop || 0, target.scrollLeft || 0);
            if (!tooltipPinnedRef.current) {
                clearTooltip();
            }
        });
    }, [clearTooltip, updateOffsets]);

    const handleWheelCapture = useCallback((event) => {
        const element = scrollRef.current;
        if (!element) {
            return;
        }
        const target = event.target;
        if (target instanceof Element) {
            const tooltipScroll = target.closest('[data-heatmap-scroll="projects"]');
            if (tooltipScroll) {
                const canScroll = tooltipScroll.scrollHeight > tooltipScroll.clientHeight;
                if (canScroll) {
                    return;
                }
            }
        }
        const canScrollY = element.scrollHeight > element.clientHeight;
        const canScrollX = element.scrollWidth > element.clientWidth;
        if (!canScrollY && !canScrollX) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();

        const maxScrollTop = Math.max(element.scrollHeight - element.clientHeight, 0);
        const maxScrollLeft = Math.max(element.scrollWidth - element.clientWidth, 0);

        if (event.deltaY && canScrollY) {
            element.scrollTop = clamp(element.scrollTop + event.deltaY, 0, maxScrollTop);
        }
        if (event.deltaX && canScrollX) {
            element.scrollLeft = clamp(element.scrollLeft + event.deltaX, 0, maxScrollLeft);
        }
    }, []);

    const fetchSlice = useCallback(async (offsetRow, offsetColumn, { prefetch = false } = {}) => {
        if (loadingFilters) {
            return null;
        }

        const cacheKey = `${filterKey}|r${offsetRow}|c${offsetColumn}|rl${rowLimit}|cl${columnLimit}`;

        if (cacheRef.current.has(cacheKey)) {
            return cacheRef.current.get(cacheKey);
        }

        if (inflightRef.current.has(cacheKey)) {
            return inflightRef.current.get(cacheKey);
        }

        const requestPromise = (async () => {
            try {
                const result = await getHeatmapData({
                    years,
                    country_ids: countryIds,
                    project_ids: projectIds,
                    objective,
                    view,
                    row_offset: offsetRow,
                    row_limit: rowLimit,
                    column_offset: offsetColumn,
                    column_limit: columnLimit,
                });

                if (!result || result.error) {
                    throw new Error(result?.error || 'Falha ao carregar heatmap.');
                }

                cacheRef.current.set(cacheKey, result);
                return result;
            } catch (fetchError) {
                if (!prefetch) {
                    setError(`Falha Heatmap: ${fetchError.message}`);
                }
                return null;
            } finally {
                inflightRef.current.delete(cacheKey);
            }
        })();

        inflightRef.current.set(cacheKey, requestPromise);
        return requestPromise;
    }, [loadingFilters, filterKey, rowLimit, columnLimit, years, countryIds, projectIds, objective, view]);

    const prefetchNeighbors = useCallback((currentData) => {
        if (!currentData) {
            return;
        }

        const nextRowOffset = Math.min(currentData.row_offset + rowLimit, Math.max(currentData.row_count - rowLimit, 0));
        const nextColumnOffset = Math.min(currentData.column_offset + columnLimit, Math.max(currentData.column_count - columnLimit, 0));

        if (nextRowOffset !== currentData.row_offset) {
            fetchSlice(nextRowOffset, currentData.column_offset, { prefetch: true });
        }
        if (nextColumnOffset !== currentData.column_offset) {
            fetchSlice(currentData.row_offset, nextColumnOffset, { prefetch: true });
        }
    }, [columnLimit, fetchSlice, rowLimit]);

    useEffect(() => {
        let rafId;

        const measure = () => {
            const element = scrollRef.current;
            if (!element) {
                return;
            }
            const width = element.clientWidth || 0;
            const height = element.clientHeight || 0;
            if (!width || !height) {
                rafId = requestAnimationFrame(measure);
                return;
            }
            setViewport((prev) => {
                if (Math.abs(prev.width - width) < 4 && Math.abs(prev.height - height) < 4) {
                    return prev;
                }
                return { width, height };
            });
        };

        rafId = requestAnimationFrame(measure);

        const handleResize = () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(measure);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        if (!viewport.width || !viewport.height) {
            return;
        }
        const visibleRows = Math.max(
            1,
            Math.floor((viewport.height - headerHeight) / ROW_HEIGHT),
        );
        const visibleColumns = Math.max(
            1,
            Math.floor(viewport.width / CELL_WIDTH),
        );
        const nextRowLimit = Math.min(
            Math.max(1, visibleRows + PREFETCH_BUFFER * 2),
            MAX_ROW_LIMIT,
        );
        const nextColumnLimit = Math.min(
            Math.max(1, visibleColumns + PREFETCH_BUFFER * 2),
            MAX_COLUMN_LIMIT,
        );
        setLimits((prev) => {
            if (prev.rowLimit === nextRowLimit && prev.columnLimit === nextColumnLimit) {
                return prev;
            }
            return { rowLimit: nextRowLimit, columnLimit: nextColumnLimit };
        });
        setLimitsReady(true);
    }, [headerHeight, viewport.height, viewport.width]);

    useEffect(() => {
        cacheRef.current.clear();
        setSliceData(null);
        setError(null);
        setRowOffset(0);
        setColumnOffset(0);
        setScrollTop(0);
        setScrollLeft(0);
        clearTooltip();
        setPinnedKey(null);
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
            scrollRef.current.scrollLeft = 0;
        }
    }, [filterKey, clearTooltip]);

    useEffect(() => {
        if (!viewport.width || !viewport.height || !limitsReady) {
            return;
        }

        let isMounted = true;

        const loadSlice = async () => {
            const cacheKey = `${filterKey}|r${rowOffset}|c${columnOffset}|rl${rowLimit}|cl${columnLimit}`;
            const loadId = ++activeLoadRef.current;
            const hasCached = cacheRef.current.has(cacheKey);
            if (!hasCached) {
                setIsLoading(true);
            }
            setError(null);
            const result = await fetchSlice(rowOffset, columnOffset);
            if (!isMounted || activeLoadRef.current !== loadId) {
                return;
            }
            if (result) {
                setSliceData(result);
                prefetchNeighbors(result);
            }
            if (!hasCached) {
                setIsLoading(false);
            }
        };

        loadSlice();

        return () => {
            isMounted = false;
        };
    }, [fetchSlice, rowOffset, columnOffset, viewport.width, viewport.height, limitsReady, prefetchNeighbors]);

    useEffect(() => {
        setShowProjects(false);
        setProjectState({
            key: tooltipKey,
            projects: [],
            total: 0,
            hasMore: false,
            loading: false,
            error: null,
        });
    }, [tooltipKey]);

    useEffect(() => {
        tooltipPinnedRef.current = Boolean(pinnedKey);
    }, [pinnedKey]);

    useLayoutEffect(() => {
        if (!tooltipRef.current) {
            return;
        }
        const { offsetWidth, offsetHeight } = tooltipRef.current;
        if (!offsetWidth || !offsetHeight) {
            return;
        }
        setTooltipSize((prev) => {
            if (prev.width === offsetWidth && prev.height === offsetHeight) {
                return prev;
            }
            return { width: offsetWidth, height: offsetHeight };
        });
    }, [tooltip, showProjects, projectState.projects.length]);

    const loadProjects = useCallback(async (offset = 0) => {
        if (!tooltip?.cell || tooltip.cell.project_count <= 0) {
            return;
        }

        const requestKey = tooltipKey;

        setProjectState((prev) => ({
            ...prev,
            key: requestKey,
            loading: true,
            error: null,
        }));

        try {
            const response = await getHeatmapCellProjects({
                year: tooltip.cell.year,
                countryId: tooltip.cell.country_id,
                objective,
                limit: PROJECT_PAGE_SIZE,
                offset,
            });

            setProjectState((prev) => {
                const projects = offset === 0
                    ? response.projects
                    : [...prev.projects, ...response.projects];

                return {
                    key: requestKey,
                    projects,
                    total: response.total,
                    hasMore: response.has_more,
                    loading: false,
                    error: null,
                };
            });
        } catch (fetchError) {
            setProjectState((prev) => ({
                ...prev,
                loading: false,
                error: fetchError?.message || 'Falha ao carregar projetos.',
            }));
        }
    }, [objective, tooltip, tooltipKey]);

    const handleProjectListToggle = useCallback((event) => {
        if (event?.stopPropagation) {
            event.stopPropagation();
        }
        if (!tooltip?.cell || tooltip.cell.project_count <= 0) {
            return;
        }
        const shouldOpen = !showProjects;
        setShowProjects(shouldOpen);
        if (shouldOpen && !projectState.loading && projectState.projects.length === 0) {
            loadProjects(0);
        }
    }, [loadProjects, projectState.loading, projectState.projects.length, showProjects, tooltip]);

    const handleLoadMore = useCallback(() => {
        if (projectState.loading || !projectState.hasMore) {
            return;
        }
        loadProjects(projectState.projects.length);
    }, [loadProjects, projectState.hasMore, projectState.loading, projectState.projects.length]);

    const handleCellOver = useCallback((cell, anchor) => {
        if (!cell || !anchor) {
            return;
        }
        if (hideTooltipTimeoutRef.current) {
            clearTimeout(hideTooltipTimeoutRef.current);
        }
        const nextKey = getTooltipKeyFromCell(cell);
        if (pinnedKey && pinnedKey !== nextKey) {
            return;
        }
        setTooltip({
            cell,
            ...anchor,
        });
    }, [getTooltipKeyFromCell, pinnedKey]);

    const handleCellClick = useCallback((cell, anchor, source = 'overlay') => {
        if (!cell) {
            console.log('[heatmap] click ignorado: celula vazia', { source });
            return;
        }
        const nextKey = getTooltipKeyFromCell(cell);
        if (!nextKey) {
            console.log('[heatmap] click ignorado: chave invalida', { source, cell });
            return;
        }
        console.log('[heatmap] click célula', {
            source,
            nextKey,
            pinnedKey,
            rowOffset,
            columnOffset,
            rowLimit,
            columnLimit,
            rows: rows.length,
            columns: columns.length,
            sliceRowOffset: sliceData?.row_offset,
            sliceColumnOffset: sliceData?.column_offset,
            isLoading,
        });
        if (hideTooltipTimeoutRef.current) {
            clearTimeout(hideTooltipTimeoutRef.current);
        }
        if (pinnedKey === nextKey) {
            console.log('[heatmap] unpin tooltip', { source, nextKey });
            setPinnedKey(null);
            tooltipPinnedRef.current = false;
            clearTooltip();
            return;
        }
        if (!anchor) {
            console.log('[heatmap] click ignorado: anchor indefinido', { source, nextKey });
            return;
        }
        tooltipPinnedRef.current = true;
        setTooltip({
            cell,
            ...anchor,
        });
        setPinnedKey(nextKey);
        console.log('[heatmap] pin tooltip', { source, nextKey });
    }, [
        clearTooltip,
        columnLimit,
        columnOffset,
        getTooltipKeyFromCell,
        isLoading,
        pinnedKey,
        rowLimit,
        rowOffset,
        rows.length,
        columns.length,
        sliceData?.row_offset,
        sliceData?.column_offset,
    ]);

    const handlePointOver = useCallback((point) => {
        if (!point?.custom) {
            return;
        }
        const anchor = getAnchorFromPoint(point);
        handleCellOver(point.custom, anchor);
    }, [getAnchorFromPoint, handleCellOver]);

    const handlePointClick = useCallback((point) => {
        if (!point?.custom) {
            console.log('[heatmap] click ignorado: ponto sem custom');
            return;
        }
        const anchor = getAnchorFromPoint(point);
        handleCellClick(point.custom, anchor, 'chart');
    }, [getAnchorFromPoint, handleCellClick]);

    const handlePointOut = useCallback(() => {
        if (hideTooltipTimeoutRef.current) {
            clearTimeout(hideTooltipTimeoutRef.current);
        }
        hideTooltipTimeoutRef.current = setTimeout(() => {
            if (!tooltipPinnedRef.current) {
                clearTooltip();
            }
        }, 220);
    }, [clearTooltip]);

    const exportButtonRef = useRef(null);
    const positionExportMenu = useCallback(() => {
        const chart = chartRef.current?.chart;
        if (!chart) return;
        const menu = chart.container?.querySelector('.highcharts-contextmenu');
        if (!menu) return;
        const anchorRect = exportButtonRef.current?.getBoundingClientRect()
            || chart.container?.querySelector('.highcharts-contextbutton')?.getBoundingClientRect();
        if (!anchorRect) return;

        document.body.appendChild(menu);
        menu.style.position = 'fixed';
        menu.style.zIndex = '9999';
        menu.style.pointerEvents = 'auto';
        menu.style.maxHeight = '70vh';
        menu.style.overflow = 'auto';

        requestAnimationFrame(() => {
            const menuRect = menu.getBoundingClientRect();
            const left = Math.min(anchorRect.left, window.innerWidth - menuRect.width - 8);
            const top = Math.min(anchorRect.bottom + 6, window.innerHeight - menuRect.height - 8);
            menu.style.left = `${Math.max(8, left)}px`;
            menu.style.top = `${Math.max(8, top)}px`;
            menu.querySelectorAll('.highcharts-menu-item').forEach((item) => {
                if (item.dataset.tourExportEvent === 'tour:export-heatmap') return;
                item.dataset.tourExportEvent = 'tour:export-heatmap';
                item.addEventListener('click', () => {
                    document.dispatchEvent(new CustomEvent('tour:export-heatmap'));
                });
            });
        });
    }, []);

    const handleExportClick = useCallback(() => {
        const chart = chartRef.current?.chart;
        if (!chart) {
            return;
        }
        if (chart.exporting?.showExportMenu) {
            chart.exporting.showExportMenu();
            setTimeout(() => positionExportMenu(), 0);
            return;
        }
        const btn = chart.container?.querySelector('.highcharts-contextbutton');
        if (btn) {
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            setTimeout(() => positionExportMenu(), 0);
        }
    }, []);

    const exportMarginTop = isCountryColumns ? Math.max(headerHeight, 100) : 60;
    const options = useMemo(() => ({
        chart: {
            type: 'heatmap',
            backgroundColor: 'transparent',
            margin: [0, 0, 0, 0],
            spacing: [0, 0, 0, 0],
            height: rows.length * ROW_HEIGHT,
            width: columns.length * CELL_WIDTH,
            animation: false,
            events: {
                render() {},
            },
        },
        title: { text: null },
        xAxis: {
            categories: columns,
            visible: false,
            min: 0,
            max: columns.length - 1,
        },
        yAxis: {
            categories: rows,
            visible: false,
            min: 0,
            max: rows.length - 1,
            reversed: true,
        },
        colorAxis: {
            min: 0,
            max: maxColorValue > 0 ? maxColorValue : 1,
            stops: [
                [0, 'rgba(88, 166, 255, 0.05)'],
                [0.35, 'rgba(88, 166, 255, 0.35)'],
                [1, '#58A6FF'],
            ],
        },
        legend: { enabled: false },
        tooltip: { enabled: false },
        plotOptions: {
            series: {
                borderWidth: 1,
                borderColor: 'rgba(48, 54, 61, 0.65)',
                dataLabels: {
                    enabled: true,
                    formatter: function () {
                        const percent = this.point?.custom?.percent_of_total || 0;
                        return formatPercent(percent);
                    },
                    style: {
                        fontSize: '10px',
                        fontWeight: '600',
                        textOutline: 'none',
                    },
                },
                point: {
                    events: {
                        mouseOver: function () {
                            handlePointOver(this);
                        },
                        mouseOut: function () {
                            handlePointOut();
                        },
                        click: function () {
                            handlePointClick(this);
                        },
                    },
                },
            },
        },
        series: [{
            data: points,
            colsize: 1,
            rowsize: 1,
            turboThreshold: 0,
        }],
        credits: { enabled: false },
        exporting: {
            enabled: true,
            buttons: {
                contextButton: {
                    enabled: true,
                    menuItems: [
                        'viewFullscreen',
                        'printChart',
                        'separator',
                        'downloadPNG',
                        'downloadJPEG',
                        'downloadPDF',
                        'downloadSVG',
                    ],
                    theme: {
                        style: { opacity: 0 },
                        states: {
                            hover: { opacity: 0 },
                            select: { opacity: 0 },
                        },
                    },
                },
            },
            chartOptions: {
                chart: {
                    margin: [exportMarginTop, 20, 40, 120],
                },
                xAxis: {
                    visible: true,
                    opposite: true,
                    lineWidth: 0,
                    tickLength: 0,
                    labels: {
                        rotation: isCountryColumns ? -90 : 0,
                        align: isCountryColumns ? 'right' : 'center',
                        style: {
                            fontSize: '10px',
                            textOverflow: 'ellipsis',
                        },
                    },
                },
                yAxis: {
                    visible: true,
                    lineWidth: 0,
                    tickLength: 0,
                    labels: {
                        style: {
                            fontSize: '10px',
                            textOverflow: 'ellipsis',
                        },
                    },
                },
            },
        },
    }), [
        columns,
        rows,
        maxColorValue,
        points,
        handlePointOver,
        handlePointOut,
        handlePointClick,
        exportMarginTop,
        isCountryColumns,
    ]);

    const tooltipStyle = useMemo(() => {
        if (!tooltip) {
            return null;
        }
        if (typeof window === 'undefined') {
            return null;
        }
        const offset = 8;
        const anchorX = tooltip.anchorX || 0;
        const anchorTop = tooltip.anchorTop ?? 0;
        const anchorBottom = tooltip.anchorBottom ?? anchorTop;
        const containerRect = containerRef.current?.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollX = window.scrollX || window.pageXOffset || 0;
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const availableWidth = Math.max(viewportWidth - offset * 2, 0);
        const fallbackWidth = Math.min(360, Math.max(availableWidth, 220));
        const width = Math.min(tooltipSize.width || fallbackWidth, availableWidth || fallbackWidth);
        const availableHeight = Math.max(viewportHeight - offset * 2, 0);
        const fallbackHeight = showProjects ? 380 : 260;
        const height = Math.min(tooltipSize.height || fallbackHeight, availableHeight || fallbackHeight);

        const containerLeft = containerRect?.left || 0;
        const containerTop = containerRect?.top || 0;
        const anchorScreenX = containerLeft + anchorX;
        const anchorScreenTop = containerTop + anchorTop;
        const anchorScreenBottom = containerTop + anchorBottom;

        const maxLeft = Math.max(offset, viewportWidth - width - offset);
        let leftInViewport = anchorScreenX - (width / 2);
        let placement = 'top';

        leftInViewport = clamp(leftInViewport, offset, maxLeft);

        let topInViewport;
        if (showProjects) {
            placement = 'bottom';
            topInViewport = anchorScreenBottom + offset;
        } else {
            topInViewport = anchorScreenTop - height - offset;
            if (topInViewport < offset) {
                topInViewport = anchorScreenBottom + offset;
                placement = 'bottom';
            }
            topInViewport = clamp(topInViewport, offset, Math.max(offset, viewportHeight - height - offset));
        }

        const arrowLeft = clamp(anchorScreenX - leftInViewport, 12, Math.max(width - 12, 12));

        return {
            left: leftInViewport + scrollX,
            top: topInViewport + scrollY,
            placement,
            arrowLeft,
            width,
        };
    }, [tooltip, showProjects, tooltipSize.height, tooltipSize.width, viewport.height, viewport.width]);

    const isTooltipPinned = Boolean(pinnedKey && tooltipKey && pinnedKey === tooltipKey);

    const tooltipArrowStyle = useMemo(() => {
        if (!tooltipStyle) {
            return null;
        }
        const baseStyle = {
            left: `${tooltipStyle.arrowLeft}px`,
        };

        const arrowColor = 'rgba(22, 27, 34, 0.95)';
        if (tooltipStyle.placement === 'bottom') {
            return {
                ...baseStyle,
                top: '-8px',
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: `8px solid ${arrowColor}`,
            };
        }

        return {
            ...baseStyle,
            bottom: '-8px',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: `8px solid ${arrowColor}`,
        };
    }, [tooltipStyle]);

    const rowLabelOffset = (displayRowOffset * ROW_HEIGHT) - scrollTop;
    const skeletonState = useMemo(() => {
        if (!isLoading || !sliceData || !rowCount || !columnCount || !viewport.width || !viewport.height) {
            return { cells: [], rows: [], columns: [] };
        }

        const scrollTopForRows = Math.max(scrollTop - headerHeight, 0);
        const scrollBottomForRows = Math.max(scrollTop + viewport.height - headerHeight, 0);
        const visibleRowStart = clamp(Math.floor(scrollTopForRows / ROW_HEIGHT), 0, rowCount - 1);
        const visibleRowEnd = clamp(Math.ceil(scrollBottomForRows / ROW_HEIGHT) - 1, 0, rowCount - 1);

        const visibleColumnStart = clamp(Math.floor(scrollLeft / CELL_WIDTH), 0, columnCount - 1);
        const visibleColumnEnd = clamp(Math.ceil((scrollLeft + viewport.width) / CELL_WIDTH) - 1, 0, columnCount - 1);

        const hasRowsLoaded = rows.length > 0;
        const hasColumnsLoaded = columns.length > 0;
        const loadedRowStart = hasRowsLoaded ? displayRowOffset : -1;
        const loadedRowEnd = hasRowsLoaded ? displayRowOffset + rows.length - 1 : -1;
        const loadedColumnStart = hasColumnsLoaded ? displayColumnOffset : -1;
        const loadedColumnEnd = hasColumnsLoaded ? displayColumnOffset + columns.length - 1 : -1;

        const pendingCells = [];
        const pendingRows = [];
        const pendingColumns = [];

        for (let rowIndex = visibleRowStart; rowIndex <= visibleRowEnd; rowIndex += 1) {
            const rowLoaded = hasRowsLoaded && rowIndex >= loadedRowStart && rowIndex <= loadedRowEnd;
            if (!rowLoaded) {
                pendingRows.push(rowIndex);
            }
        }

        for (let columnIndex = visibleColumnStart; columnIndex <= visibleColumnEnd; columnIndex += 1) {
            const columnLoaded = hasColumnsLoaded && columnIndex >= loadedColumnStart && columnIndex <= loadedColumnEnd;
            if (!columnLoaded) {
                pendingColumns.push(columnIndex);
            }
        }

        for (let rowIndex = visibleRowStart; rowIndex <= visibleRowEnd; rowIndex += 1) {
            const rowLoaded = hasRowsLoaded && rowIndex >= loadedRowStart && rowIndex <= loadedRowEnd;
            for (let columnIndex = visibleColumnStart; columnIndex <= visibleColumnEnd; columnIndex += 1) {
                const columnLoaded = hasColumnsLoaded && columnIndex >= loadedColumnStart && columnIndex <= loadedColumnEnd;
                if (rowLoaded && columnLoaded) {
                    continue;
                }
                pendingCells.push({
                    rowIndex,
                    columnIndex,
                });
            }
        }

        return {
            cells: pendingCells,
            rows: pendingRows,
            columns: pendingColumns,
        };
    }, [
        columns.length,
        columnCount,
        displayColumnOffset,
        displayRowOffset,
        headerHeight,
        isLoading,
        rowCount,
        rows.length,
        scrollLeft,
        scrollTop,
        sliceData,
        viewport.height,
        viewport.width,
    ]);

    const skeletonCells = skeletonState.cells;
    const skeletonRows = skeletonState.rows;
    const skeletonColumns = skeletonState.columns;

    const showLoading = (isLoading || loadingFilters) && !sliceData;
    const isReady = viewport.width > 0 && viewport.height > 0;

    return (
        <div ref={containerRef} className="relative flex flex-col h-full min-h-0 overflow-visible">
            {showLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-dark-bg/40">
                    <LoadingSpinner />
                </div>
            )}
            {error && (
                <div className="flex-grow flex justify-center items-center text-center p-6 bg-red-900/20 text-red-400 border border-red-700 rounded-md">
                    Erro: {error}
                </div>
            )}
            {!error && (
                <div className="flex flex-1 min-h-0 flex-col">
                    <div className="flex items-center justify-end pb-2">
                        <div
                            className="inline-flex items-center justify-center"
                            data-tour="heatmap-export"
                            ref={exportButtonRef}
                        >
                            <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-dark-border bg-white shadow-sm hover:shadow-md"
                                onClick={handleExportClick}
                                aria-label="Exportar heatmap"
                            >
                                <span className="inline-flex flex-col gap-[3px]">
                                    <span className="block h-[2px] w-[14px] rounded bg-black/50"></span>
                                    <span className="block h-[2px] w-[14px] rounded bg-black/50"></span>
                                    <span className="block h-[2px] w-[14px] rounded bg-black/50"></span>
                                </span>
                            </button>
                        </div>
                    </div>
                    <div
                        ref={viewportRef}
                        className="relative flex h-full w-full min-h-0 min-w-0 flex-1 border border-dark-border rounded-lg overflow-hidden"
                        style={{ isolation: 'isolate' }}
                        onWheelCapture={handleWheelCapture}
                    >
                        <div
                            className="absolute inset-y-0 left-0 z-20 bg-dark-card pointer-events-none"
                            style={{ width: LABEL_WIDTH + TOTAL_WIDTH }}
                        />
                        <div
                            className="absolute left-0 right-0 z-30 border-b border-dark-border pointer-events-none"
                            style={{ top: Math.max(headerHeight - 1, 0) }}
                        />
                        <div
                            className="relative z-40 flex h-full min-h-0 flex-shrink-0 flex-col bg-dark-card border-r border-dark-border shadow-[2px_0_6px_rgba(0,0,0,0.35)]"
                            style={{ width: LABEL_WIDTH + TOTAL_WIDTH }}
                        >
                            <div
                                className="relative z-40 flex items-center text-xs text-dark-text-secondary border-b border-dark-border bg-dark-card"
                                style={{ height: headerHeight }}
                            >
                                <span
                                    className="font-semibold flex-shrink-0 pl-2 pr-2"
                                    style={{ width: LABEL_WIDTH }}
                                >
                                    {view === 'country_year' ? 'País' : 'Ano'}
                                </span>
                                <span
                                    className="text-right font-semibold flex-shrink-0 whitespace-nowrap pl-2 pr-2"
                                    style={{ width: TOTAL_WIDTH }}
                                >
                                    Total projetos
                                </span>
                            </div>
                            <div className="relative flex-1 min-h-0 overflow-hidden bg-dark-card">
                                <div
                                    className="absolute left-0 top-0 right-0"
                                    style={{ transform: `translateY(${rowLabelOffset}px)` }}
                                >
                                    {rowMeta.map((row, index) => (
                                        <div
                                            key={`${row.label}-${index}`}
                                            className="flex items-center border-b border-dark-border text-xs"
                                            style={{ height: ROW_HEIGHT }}
                                        >
                                            <span
                                                className="text-dark-text truncate flex-shrink-0 pl-2 pr-2"
                                                title={row.label}
                                                style={{ width: LABEL_WIDTH }}
                                            >
                                                {row.label}
                                            </span>
                                            <span
                                                className="text-right text-dark-text-secondary flex-shrink-0 pl-2 pr-2"
                                                title={`${row.projectCount} projetos`}
                                                style={{ width: TOTAL_WIDTH }}
                                            >
                                                {formatNumber(row.projectCount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {isLoading && sliceData && skeletonRows.length > 0 && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        {skeletonRows.map((rowIndex) => (
                                            <div
                                                key={`skeleton-row-${rowIndex}`}
                                                className="absolute left-0 right-0 flex items-center"
                                                style={{
                                                    top: rowIndex * ROW_HEIGHT - scrollTop,
                                                    height: ROW_HEIGHT,
                                                }}
                                            >
                                                <div className="ml-2 h-1.5 w-24 rounded-full bg-dark-border/70 animate-pulse" />
                                                <div className="ml-auto mr-2 h-1.5 w-12 rounded-full bg-dark-border/70 animate-pulse" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    <div
                        ref={scrollRef}
                        className="relative z-0 flex-1 min-h-0 min-w-0 h-full overflow-auto custom-scrollbar"
                        style={{ scrollbarGutter: 'stable both-edges', overscrollBehavior: 'contain' }}
                        onScroll={handleScroll}
                    >
                        <div
                            style={{
                                width: gridWidth,
                                height: gridHeight + headerHeight,
                                position: 'relative',
                            }}
                        >
                            <div
                                className="sticky top-0 z-40 bg-dark-card border-b border-dark-border"
                                style={{ height: headerHeight }}
                            >
                                <div style={{ width: gridWidth, height: headerHeight, position: 'relative' }}>
                                    <div
                                        className="grid"
                                        style={{
                                            position: 'absolute',
                                            left: displayColumnOffset * CELL_WIDTH,
                                            gridTemplateColumns: `repeat(${columns.length}, ${CELL_WIDTH}px)`,
                                            height: headerHeight,
                                        }}
                                    >
                                        {columnMeta.map((column, index) => (
                                            <div
                                                key={`${column.label}-${index}`}
                                                className="text-[10px] uppercase tracking-wide text-dark-text-secondary flex items-center justify-center"
                                                style={{ height: headerHeight }}
                                                title={column.label}
                                            >
                                                <span
                                                    className={isCountryColumns ? 'px-1' : 'truncate max-w-full px-1'}
                                                    style={isCountryColumns ? {
                                                        display: 'block',
                                                        writingMode: 'vertical-rl',
                                                        transform: 'rotate(180deg)',
                                                        maxHeight: headerHeight - 8,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    } : {
                                                        maxWidth: '100%',
                                                    }}
                                                >
                                                    {column.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {isLoading && sliceData && skeletonColumns.length > 0 && (
                                        <div
                                            className="absolute left-0 top-0 pointer-events-none"
                                            style={{ width: gridWidth, height: headerHeight }}
                                        >
                                            {skeletonColumns.map((columnIndex) => (
                                                <div
                                                    key={`skeleton-col-${columnIndex}`}
                                                    className="absolute flex items-center justify-center"
                                                    style={{
                                                        left: columnIndex * CELL_WIDTH,
                                                        width: CELL_WIDTH,
                                                        height: headerHeight,
                                                    }}
                                                >
                                                    <div
                                                        className="rounded-full bg-dark-border/70 animate-pulse"
                                                        style={isCountryColumns ? {
                                                            width: 4,
                                                            height: Math.max(headerHeight - 12, 12),
                                                        } : {
                                                            height: 6,
                                                            width: '66%',
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div
                                style={{
                                    position: 'absolute',
                                    top: headerHeight,
                                    left: 0,
                                    width: gridWidth,
                                    height: gridHeight,
                                }}
                            >
                                {rows.length > 0 && columns.length > 0 && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: displayRowOffset * ROW_HEIGHT,
                                            left: displayColumnOffset * CELL_WIDTH,
                                        }}
                                    >
                                        <div
                                            className="relative"
                                            style={{
                                                height: rows.length * ROW_HEIGHT,
                                                width: columns.length * CELL_WIDTH,
                                            }}
                                        >
                                            <HighchartsReact
                                                ref={chartRef}
                                                highcharts={Highcharts}
                                                options={options}
                                                containerProps={{
                                                    style: {
                                                        height: rows.length * ROW_HEIGHT,
                                                        width: columns.length * CELL_WIDTH,
                                                    },
                                                }}
                                            />
                                            <div className="absolute inset-0 z-10 pointer-events-none">
                                                {points.map((point) => {
                                                    const cell = point.custom;
                                                    const left = point.x * CELL_WIDTH;
                                                    const top = point.y * ROW_HEIGHT;
                                                    const key = `${cell?.year ?? 'y'}-${cell?.country_id ?? 'c'}-${point.x}-${point.y}`;
                                                    return (
                                                        <div
                                                            key={key}
                                                            className="absolute pointer-events-auto"
                                                            style={{
                                                                left,
                                                                top,
                                                                width: CELL_WIDTH,
                                                                height: ROW_HEIGHT,
                                                            }}
                                                            onMouseEnter={(event) => {
                                                                const rect = event.currentTarget.getBoundingClientRect();
                                                                handleCellOver(cell, getAnchorFromRect(rect));
                                                            }}
                                                            onMouseLeave={handlePointOut}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                const rect = event.currentTarget.getBoundingClientRect();
                                                                handleCellClick(cell, getAnchorFromRect(rect), 'overlay');
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {skeletonCells.length > 0 && (
                                    <div
                                        className="absolute left-0 top-0 z-0 pointer-events-none"
                                        style={{ width: gridWidth, height: gridHeight }}
                                    >
                                        {skeletonCells.map((cell) => (
                                            <SkeletonCell
                                                key={`s-${cell.rowIndex}-${cell.columnIndex}`}
                                                left={cell.columnIndex * CELL_WIDTH}
                                                top={cell.rowIndex * ROW_HEIGHT}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {!showLoading && rows.length === 0 && isReady && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center p-10 text-dark-text-secondary">
                        Nenhum dado encontrado para os filtros selecionados.
                    </div>
                )}

                {tooltip && tooltipStyle && typeof document !== 'undefined' && createPortal(
                    <div
                        ref={tooltipRef}
                        className={`absolute z-[1200] rounded-lg border bg-dark-card/95 p-4 text-xs shadow-xl transition-[box-shadow,border-color] ${
                            isTooltipPinned
                                ? 'border-accent-blue shadow-[0_0_0_2px_rgba(88,166,255,0.35)]'
                                : 'border-dark-border'
                        }`}
                        style={{ left: tooltipStyle.left, top: tooltipStyle.top, width: tooltipStyle.width }}
                        onMouseEnter={() => {
                            tooltipPinnedRef.current = true;
                            if (hideTooltipTimeoutRef.current) {
                                clearTimeout(hideTooltipTimeoutRef.current);
                            }
                        }}
                        onMouseLeave={() => {
                            if (!pinnedKey) {
                                tooltipPinnedRef.current = false;
                                clearTooltip();
                            }
                        }}
                    >
                        <div
                            className="absolute h-0 w-0"
                            style={tooltipArrowStyle}
                        />
                        <div className="text-sm font-semibold text-dark-text">
                            {tooltip.cell.country_name} • {tooltip.cell.year}
                        </div>
                        <div className="mt-1 text-dark-text-secondary">
                            Total doado: <span className="text-dark-text">{formatNumber(tooltip.cell.total_amount)} K USD</span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            <div className="bg-dark-bg/60 rounded-md p-2">
                                <div className="text-[10px] text-dark-text-secondary">Adaptação</div>
                                <div className="text-dark-text">{formatNumber(tooltip.cell.adaptation_exclusive)} K</div>
                            </div>
                            <div className="bg-dark-bg/60 rounded-md p-2">
                                <div className="text-[10px] text-dark-text-secondary">Mitigação</div>
                                <div className="text-dark-text">{formatNumber(tooltip.cell.mitigation_exclusive)} K</div>
                            </div>
                            <div className="bg-dark-bg/60 rounded-md p-2">
                                <div className="text-[10px] text-dark-text-secondary">Ambos</div>
                                <div className="text-dark-text">{formatNumber(tooltip.cell.overlap)} K</div>
                            </div>
                        </div>
                        <div className="mt-2 text-dark-text-secondary">
                            Participação no total: <span className="text-dark-text">{formatPercent(tooltip.cell.percent_of_total)}</span>
                            {tooltip.cell.percent_of_row ? (
                                <>
                                    {' '}· na linha: <span className="text-dark-text">{formatPercent(tooltip.cell.percent_of_row)}</span>
                                </>
                            ) : null}
                            {tooltip.cell.percent_of_column ? (
                                <>
                                    {' '}· na coluna: <span className="text-dark-text">{formatPercent(tooltip.cell.percent_of_column)}</span>
                                </>
                            ) : null}
                        </div>

                        <div className="mt-3">
                            <div className="text-[10px] text-dark-text-secondary uppercase tracking-wide">Projetos</div>
                            <div
                                className={`mt-1 inline-flex items-center gap-2 ${tooltip.cell.project_count > 0 ? 'cursor-pointer text-accent-blue' : 'text-dark-text-secondary'}`}
                                onClick={handleProjectListToggle}
                            >
                                <span className="font-semibold">{formatNumber(tooltip.cell.project_count)}</span>
                                <span>projetos</span>
                                {tooltip.cell.project_count > 0 && (
                                    <span className="text-[10px] text-dark-text-secondary">(clique aqui)</span>
                                )}
                            </div>

                            {showProjects && (
                                <div
                                    data-heatmap-scroll="projects"
                                    className="mt-2 max-h-44 overflow-y-auto custom-scrollbar rounded-md border border-dark-border bg-dark-bg/40 p-2"
                                >
                                    {projectState.loading && projectState.projects.length === 0 && (
                                        <div className="text-dark-text-secondary">Carregando projetos...</div>
                                    )}
                                    {projectState.error && (
                                        <div className="text-red-400">{projectState.error}</div>
                                    )}
                                    {!projectState.loading && projectState.projects.length === 0 && !projectState.error && (
                                        <div className="text-dark-text-secondary">Nenhum projeto encontrado.</div>
                                    )}
                                    {projectState.projects.map((project) => (
                                        <div
                                            key={project.id}
                                            className="flex items-center justify-between gap-3 border-b border-dark-border/60 py-1 text-[11px]"
                                        >
                                            <span className="truncate text-dark-text" title={project.name}>
                                                {project.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="rounded-full bg-dark-card px-2 py-0.5 text-[10px] uppercase text-dark-text-secondary">
                                                    {formatObjective(project.objective)}
                                                </span>
                                                <span className="text-[10px] text-dark-text-secondary">
                                                    {formatNumber(project.total_amount)} K USD
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {projectState.hasMore && (
                                        <button
                                            type="button"
                                            className="mt-2 w-full rounded-md border border-dark-border bg-dark-card px-3 py-1 text-[11px] text-dark-text-secondary hover:text-dark-text"
                                            onClick={handleLoadMore}
                                            disabled={projectState.loading}
                                        >
                                            {projectState.loading ? 'Carregando...' : 'Carregar mais'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>,
                    document.body
                )}
            </div>
            )}
        </div>
    );
};

export default HeatmapChart;
