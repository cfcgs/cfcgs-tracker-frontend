import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FiChevronDown,
  FiChevronUp,
  FiFilter,
  FiSave,
  FiSearch,
} from 'react-icons/fi';

const emptyLabel = '—';
const POPOVER_WIDTH = 300;
const SUGGESTION_LIMIT = 12;

const normalize = (value) => String(value ?? '').toLowerCase();

const AdminDataTable = ({
  columns,
  rows,
  rowKey = 'id',
  loading = false,
  emptyMessage = 'Nenhum dado encontrado.',
  onReachEnd,
  hasMore = false,
  onSortChange,
  sortBy,
  sortOrder,
  onCellChange,
  dirtyRowIds = new Set(),
  onSaveRow,
  rowActions,
  rowActionsWidth = 72,
  height = 520,
  activeFilters,
  onFiltersChange,
  onRequestFilterSuggestions,
  enableInlineFilters = false,
}) => {
  const containerRef = useRef(null);
  const filterPanelRef = useRef(null);
  const filterTriggerRefs = useRef({});
  const resizeStateRef = useRef(null);
  const [columnWidths, setColumnWidths] = useState(() =>
    Object.fromEntries(columns.map((column) => [column.key, column.width || 180]))
  );
  const [columnFilters, setColumnFilters] = useState(activeFilters || {});
  const [filterInputs, setFilterInputs] = useState({});
  const [openFilterKey, setOpenFilterKey] = useState(null);
  const [popoverPosition, setPopoverPosition] = useState(null);
  const [suggestionsState, setSuggestionsState] = useState({});
  const [localSort, setLocalSort] = useState({ key: null, order: 'asc' });

  useEffect(() => {
    setColumnWidths((current) => ({
      ...Object.fromEntries(
        columns.map((column) => [column.key, current[column.key] || column.width || 180])
      ),
    }));
  }, [columns]);

  useEffect(() => {
    if (!activeFilters) return;
    setColumnFilters(activeFilters);
  }, [activeFilters]);

  useEffect(() => {
    const handleMouseMove = (event) => {
      const state = resizeStateRef.current;
      if (!state) return;
      const delta = event.clientX - state.startX;
      const nextWidth = Math.max(state.minWidth, state.startWidth + delta);
      setColumnWidths((current) => ({ ...current, [state.key]: nextWidth }));
    };

    const handleMouseUp = () => {
      resizeStateRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      const trigger = openFilterKey
        ? filterTriggerRefs.current[openFilterKey]
        : null;

      if (filterPanelRef.current?.contains(event.target)) return;
      if (trigger?.contains(event.target)) return;
      setOpenFilterKey(null);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [openFilterKey]);

  const updatePopoverPosition = (columnKey) => {
    const trigger = filterTriggerRefs.current[columnKey];
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const margin = 12;
    const maxLeft = window.innerWidth - POPOVER_WIDTH - margin;
    const left = Math.max(margin, Math.min(rect.right - POPOVER_WIDTH, maxLeft));

    setPopoverPosition({
      top: rect.bottom + 8,
      left,
      width: POPOVER_WIDTH,
    });
  };

  useEffect(() => {
    if (!openFilterKey) {
      setPopoverPosition(null);
      return undefined;
    }

    updatePopoverPosition(openFilterKey);

    const reposition = () => updatePopoverPosition(openFilterKey);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);

    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [openFilterKey]);

  const updateFilters = (updater) => {
    setColumnFilters((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      onFiltersChange?.(next);
      return next;
    });
  };

  const filteredRows = useMemo(() => {
    const nextRows = rows.filter((row) =>
      columns.every((column) => {
        const selectedValues = columnFilters[column.key];
        if (!selectedValues?.length) return true;
        const rawValue = column.accessor ? column.accessor(row) : row[column.key];
        const label = rawValue === null || rawValue === undefined || rawValue === ''
          ? emptyLabel
          : String(rawValue);
        return selectedValues.includes(label);
      })
    );

    if (onSortChange || !localSort.key) {
      return nextRows;
    }

    return [...nextRows].sort((left, right) => {
      const leftValue = left[localSort.key];
      const rightValue = right[localSort.key];
      if (leftValue == null && rightValue == null) return 0;
      if (leftValue == null) return 1;
      if (rightValue == null) return -1;
      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return localSort.order === 'asc' ? leftValue - rightValue : rightValue - leftValue;
      }
      const comparison = String(leftValue).localeCompare(String(rightValue), 'pt-BR', {
        numeric: true,
        sensitivity: 'base',
      });
      return localSort.order === 'asc' ? comparison : -comparison;
    });
  }, [columnFilters, columns, localSort.key, localSort.order, onSortChange, rows]);

  const totalWidth = columns.reduce(
    (sum, column) => sum + (columnWidths[column.key] || column.width || 180),
    0,
  ) + ((rowActions || onSaveRow) ? rowActionsWidth : 0);

  const getSelectedCount = (columnKey) => columnFilters[columnKey]?.length || 0;

  const localSuggestionOptions = useMemo(() => {
    const optionsByColumn = {};
    columns.forEach((column) => {
      if (column.filterable === false) return;
      const values = new Map();
      rows.forEach((row) => {
        const rawValue = column.accessor ? column.accessor(row) : row[column.key];
        const label = rawValue === null || rawValue === undefined || rawValue === ''
          ? emptyLabel
          : String(rawValue);
        if (!values.has(label)) {
          values.set(label, label);
        }
      });
      optionsByColumn[column.key] = Array.from(values.values()).sort((left, right) =>
        String(left).localeCompare(String(right), 'pt-BR', {
          numeric: true,
          sensitivity: 'base',
        })
      );
    });
    return optionsByColumn;
  }, [columns, rows]);

  const commitFilterValue = (columnKey, rawValue) => {
    const nextValue = String(rawValue ?? '').trim();
    if (!nextValue) return;

    updateFilters((current) => {
      const currentValues = current[columnKey] || [];
      if (currentValues.includes(nextValue)) {
        return current;
      }
      return {
        ...current,
        [columnKey]: [...currentValues, nextValue],
      };
    });

    setFilterInputs((current) => ({
      ...current,
      [columnKey]: '',
    }));
  };

  const clearFilter = (columnKey) => {
    updateFilters((current) => {
      const next = { ...current };
      delete next[columnKey];
      return next;
    });
  };

  const removeFilterValue = (columnKey, valueToRemove) => {
    updateFilters((current) => {
      const currentValues = current[columnKey] || [];
      const nextValues = currentValues.filter((value) => value !== valueToRemove);
      if (!nextValues.length) {
        const next = { ...current };
        delete next[columnKey];
        return next;
      }
      return {
        ...current,
        [columnKey]: nextValues,
      };
    });
  };

  const loadSuggestions = async ({ columnKey, search, reset = false }) => {
    if (!onRequestFilterSuggestions) return;

    const currentState = suggestionsState[columnKey] || {
      items: [],
      offset: 0,
      limit: SUGGESTION_LIMIT,
      hasMore: false,
      loading: false,
      search: '',
    };

    if (currentState.loading && !reset) return;

    const nextOffset = reset ? 0 : currentState.offset + currentState.items.length;

    setSuggestionsState((current) => ({
      ...current,
      [columnKey]: {
        ...currentState,
        loading: true,
        ...(reset ? { items: [], offset: 0 } : {}),
      },
    }));

    try {
      const response = await onRequestFilterSuggestions({
        column: columnKey,
        search,
        offset: nextOffset,
        limit: SUGGESTION_LIMIT,
        activeFilters: columnFilters,
      });

      const incomingItems = response.values || [];
      setSuggestionsState((current) => {
        const previousItems = reset ? [] : (current[columnKey]?.items || []);
        return {
          ...current,
          [columnKey]: {
            items: [...previousItems, ...incomingItems],
            offset: response.offset || nextOffset,
            limit: response.limit || SUGGESTION_LIMIT,
            hasMore: response.has_more || false,
            loading: false,
            search,
          },
        };
      });
    } catch (_error) {
      setSuggestionsState((current) => ({
        ...current,
        [columnKey]: {
          ...currentState,
          loading: false,
        },
      }));
    }
  };

  useEffect(() => {
    if (!openFilterKey || !onRequestFilterSuggestions) {
      return undefined;
    }

    const search = filterInputs[openFilterKey] || '';
    let isActive = true;
    const timeoutId = window.setTimeout(async () => {
      if (!isActive) return;
      await loadSuggestions({
        columnKey: openFilterKey,
        search,
        reset: true,
      });
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [columnFilters, filterInputs, onRequestFilterSuggestions, openFilterKey]);

  const visibleOptions = useMemo(() => {
    if (!openFilterKey) return [];

    if (onRequestFilterSuggestions) {
      const suggestionItems = suggestionsState[openFilterKey]?.items || [];
      return suggestionItems.map((item) => {
        const label = item === null || item === undefined || item === '' ? emptyLabel : String(item);
        return { value: label, label };
      });
    }

    const rawSearch = filterInputs[openFilterKey] || '';
    return (localSuggestionOptions[openFilterKey] || [])
      .filter((item) => normalize(item).includes(normalize(rawSearch)))
      .slice(0, 100)
      .map((item) => ({ value: item, label: item }));
  }, [filterInputs, localSuggestionOptions, onRequestFilterSuggestions, openFilterKey, suggestionsState]);

  const handleSuggestionScroll = (columnKey, event) => {
    const element = event.currentTarget;
    const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
    const state = suggestionsState[columnKey];
    if (remaining < 24 && state?.hasMore && !state?.loading) {
      loadSuggestions({
        columnKey,
        search: filterInputs[columnKey] || '',
        reset: false,
      });
    }
  };

  const handleScroll = (event) => {
    const element = event.currentTarget;
    const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (remaining < 200 && hasMore && onReachEnd && !loading) {
      onReachEnd();
    }
  };

  return (
    <div className="admin-table-shell">
      <div
        ref={containerRef}
        className="admin-table-scroll custom-scrollbar"
        style={{ maxHeight: height }}
        onScroll={handleScroll}
      >
        <table className="admin-table" style={{ width: totalWidth }}>
          <colgroup>
            {columns.map((column) => (
              <col key={`col-${column.key}`} style={{ width: columnWidths[column.key] || column.width || 180 }} />
            ))}
            {(rowActions || onSaveRow) ? <col style={{ width: rowActionsWidth }} /> : null}
          </colgroup>
          <thead>
            <tr>
              {columns.map((column) => {
                const effectiveSortBy = onSortChange ? sortBy : localSort.key;
                const effectiveSortOrder = onSortChange ? sortOrder : localSort.order;
                const isSorted = effectiveSortBy === column.key;
                const selectedCount = getSelectedCount(column.key);
                return (
                  <th
                    key={column.key}
                    className={column.headClassName || ''}
                    style={{ width: columnWidths[column.key], minWidth: column.minWidth || 120 }}
                  >
                    <div className="admin-table-head-cell">
                      <button
                        type="button"
                        className={`admin-table-sort ${column.sortable ? 'is-sortable' : ''}`}
                        onClick={() => {
                          if (!column.sortable) return;
                          if (onSortChange) {
                            onSortChange(column.key);
                            return;
                          }
                          setLocalSort((current) => ({
                            key: column.key,
                            order: current.key === column.key && current.order === 'asc' ? 'desc' : 'asc',
                          }));
                        }}
                      >
                        <span>{column.label}</span>
                        {column.sortable && isSorted ? (
                          effectiveSortOrder === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                        ) : null}
                      </button>

                      <div className="admin-table-head-tools">
                        {enableInlineFilters && column.filterable !== false ? (
                          <button
                            ref={(element) => {
                              filterTriggerRefs.current[column.key] = element;
                            }}
                            type="button"
                            className={`admin-table-filter-trigger ${selectedCount ? 'is-active' : ''}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenFilterKey((current) => {
                                const nextKey = current === column.key ? null : column.key;
                                if (nextKey) {
                                  requestAnimationFrame(() => updatePopoverPosition(nextKey));
                                }
                                return nextKey;
                              });
                            }}
                            title={`Filtrar ${column.label}`}
                          >
                            <FiFilter />
                            {selectedCount ? <span className="admin-table-filter-count">{selectedCount}</span> : null}
                          </button>
                        ) : null}
                      </div>

                      <span
                        className="admin-table-resizer"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          resizeStateRef.current = {
                            key: column.key,
                            startX: event.clientX,
                            startWidth: columnWidths[column.key],
                            minWidth: column.minWidth || 120,
                          };
                          document.body.style.cursor = 'col-resize';
                          document.body.style.userSelect = 'none';
                        }}
                      />
                    </div>
                  </th>
                );
              })}
              {(rowActions || onSaveRow) && (
                <th
                  className="admin-table-actions-head"
                  style={{ width: rowActionsWidth, minWidth: rowActionsWidth, maxWidth: rowActionsWidth }}
                >
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {!filteredRows.length && !loading ? (
              <tr>
                <td colSpan={columns.length + ((rowActions || onSaveRow) ? 1 : 0)} className="admin-table-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : null}
            {filteredRows.map((row) => {
              const id = row[rowKey];
              const isDirty = dirtyRowIds.has(id);
              return (
                <tr key={id} className={isDirty ? 'is-dirty' : ''}>
                  {columns.map((column) => {
                    const cellValue = column.accessor ? column.accessor(row) : row[column.key];
                    return (
                      <td
                        key={`${id}-${column.key}`}
                        className={column.cellClassName || ''}
                        style={{ width: columnWidths[column.key] }}
                      >
                        {column.editable && onCellChange ? (
                          <input
                            type={column.type === 'number' ? 'number' : 'text'}
                            step={column.type === 'number' ? 'any' : undefined}
                            value={cellValue ?? ''}
                            onChange={(event) => onCellChange(id, column.key, event.target.value, column.type)}
                            className="admin-table-input"
                          />
                        ) : column.render ? (
                          column.render(row)
                        ) : (
                          <span>{cellValue ?? '—'}</span>
                        )}
                      </td>
                    );
                  })}
                  {(rowActions || onSaveRow) && (
                    <td
                      className="admin-table-actions"
                      style={{ width: rowActionsWidth, minWidth: rowActionsWidth, maxWidth: rowActionsWidth }}
                    >
                      <div className="flex items-center justify-end gap-2 overflow-hidden">
                        {rowActions ? rowActions(row) : null}
                        {onSaveRow ? (
                          <button
                            type="button"
                            onClick={() => onSaveRow(row)}
                            disabled={!isDirty}
                            className={`admin-inline-action ${isDirty ? 'is-primary' : 'is-muted'}`}
                          >
                            <FiSave />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading ? (
          <div className="admin-table-loading">Carregando mais linhas...</div>
        ) : null}
      </div>

      {openFilterKey && popoverPosition
        ? createPortal(
            <div
              ref={filterPanelRef}
              className="admin-table-filter-popover"
              style={{
                position: 'fixed',
                top: popoverPosition.top,
                left: popoverPosition.left,
                width: popoverPosition.width,
              }}
            >
              <div className="admin-table-filter-search">
                <FiSearch />
                <input
                  type="text"
                  value={filterInputs[openFilterKey] || ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFilterInputs((current) => ({
                      ...current,
                      [openFilterKey]: value,
                    }));
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    const typedValue = (filterInputs[openFilterKey] || '').trim();
                    if (!typedValue) return;
                    const exactMatch = visibleOptions.find((option) => normalize(option.label) === normalize(typedValue));
                    commitFilterValue(openFilterKey, exactMatch ? exactMatch.value : typedValue);
                  }}
                  placeholder="Pesquisar opções..."
                  className="admin-table-filter-search-input"
                />
              </div>

              <div className="admin-table-filter-actions">
                <button
                  type="button"
                  className="admin-table-filter-action"
                  onClick={() => clearFilter(openFilterKey)}
                >
                  Limpar
                </button>
                <button
                  type="button"
                  className="admin-table-filter-action"
                  onClick={() => setOpenFilterKey(null)}
                >
                  Fechar
                </button>
              </div>

              <div
                className="admin-table-filter-options custom-scrollbar"
                onScroll={(event) => handleSuggestionScroll(openFilterKey, event)}
              >
                {(columnFilters[openFilterKey] || []).length ? (
                  <div className="admin-table-filter-selected-group">
                    {(columnFilters[openFilterKey] || []).map((value) => (
                      <button
                        key={`${openFilterKey}-selected-${value}`}
                        type="button"
                        className="admin-table-filter-option is-selected"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => removeFilterValue(openFilterKey, value)}
                        title="Remover filtro"
                      >
                        <span>{value}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
                {suggestionsState[openFilterKey]?.loading && !visibleOptions.length ? (
                  <div className="admin-table-filter-empty">Buscando sugestões...</div>
                ) : !visibleOptions.length ? (
                  <div className="admin-table-filter-empty">Nenhuma opção encontrada.</div>
                ) : (
                  visibleOptions
                    .filter((option) => !(columnFilters[openFilterKey] || []).includes(option.value))
                    .map((option) => (
                      <button
                        key={`${openFilterKey}-${option.value}`}
                        type="button"
                        className="admin-table-filter-option"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => commitFilterValue(openFilterKey, option.value)}
                        title={option.label}
                      >
                        <span>{option.label}</span>
                      </button>
                    ))
                )}
                {suggestionsState[openFilterKey]?.loading && visibleOptions.length ? (
                  <div className="admin-table-filter-empty">Carregando mais...</div>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};

export default AdminDataTable;
