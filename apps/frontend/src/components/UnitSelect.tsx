import React, { useState, useRef, useEffect, useId, useMemo, useCallback } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { 
  filterGroupedUnits, 
  getUnitDefinition, 
  type UnitDefinition 
} from '../constants/uom';

export interface UnitSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  error?: string;
  className?: string;
}

export const UnitSelect: React.FC<UnitSelectProps> = ({
  id,
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = 'Select unit of measure...',
  error,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const baseId = useId();
  const selectId = id || `unit-select-${baseId}`;
  const listboxId = `unit-listbox-${baseId}`;

  // Filter units grouped by category based on current search query
  const groupedUnits = useMemo(() => {
    return filterGroupedUnits(searchQuery, value);
  }, [searchQuery, value]);

  // Flattened list of visible units for arrow-key navigation
  const flatVisibleUnits = useMemo(() => {
    return groupedUnits.flatMap(g => g.units);
  }, [groupedUnits]);

  // Get definition of current selected value
  const selectedDef = useMemo(() => {
    return getUnitDefinition(value);
  }, [value]);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setSearchQuery('');
    const idx = flatVisibleUnits.findIndex(u => u.symbol.toLowerCase() === value.toLowerCase());
    setHighlightedIndex(idx >= 0 ? idx : 0);
    setIsOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  }, [disabled, flatVisibleUnits, value]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  }, []);

  const toggleDropdown = useCallback(() => {
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }, [isOpen, closeDropdown, openDropdown]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, closeDropdown]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const activeOption = listboxRef.current.querySelector(
        `[data-option-index="${highlightedIndex}"]`
      ) as HTMLElement | null;
      if (activeOption) {
        activeOption.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelectUnit = (unit: UnitDefinition) => {
    onChange(unit.symbol);
    closeDropdown();
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (flatVisibleUnits.length > 0) {
          setHighlightedIndex(prev => (prev + 1) % flatVisibleUnits.length);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (flatVisibleUnits.length > 0) {
          setHighlightedIndex(prev => (prev - 1 + flatVisibleUnits.length) % flatVisibleUnits.length);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (flatVisibleUnits.length > 0 && highlightedIndex >= 0 && highlightedIndex < flatVisibleUnits.length) {
          handleSelectUnit(flatVisibleUnits[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeDropdown();
        triggerRef.current?.focus();
        break;
      case 'Tab':
        closeDropdown();
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} onKeyDown={handleKeyDown}>
      {/* Hidden input to satisfy native form validation if required */}
      {required && (
        <input
          type="text"
          value={value}
          required={required}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={`w-full px-3 py-2 border bg-white text-sm text-left flex items-center justify-between transition-all rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ${
          error ? 'border-red-500' : 'border-slate-300'
        } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'hover:border-slate-400 text-slate-900 cursor-pointer'}`}
      >
        <span className="truncate pr-2">
          {value ? (
            selectedDef ? (
              <span className="flex items-center gap-1.5">
                <span className="font-mono font-semibold text-slate-900">{selectedDef.symbol}</span>
                <span className="text-slate-500">— {selectedDef.name}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="font-mono font-semibold text-slate-900">{value}</span>
                <span className="text-amber-600 text-xs font-medium">(Non-standard)</span>
              </span>
            )
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-600' : ''}`} 
          aria-hidden="true"
        />
      </button>

      {/* Error message if provided */}
      {error && (
        <p className="mt-1 text-xs text-red-600 font-medium" role="alert">{error}</p>
      )}

      {/* Dropdown Popover */}
      {isOpen && (
        <div 
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-slate-200 shadow-lg rounded-sm overflow-hidden flex flex-col"
          style={{ minWidth: '260px' }}
        >
          {/* Search Box Header */}
          <div className="p-2 border-b border-slate-200 bg-slate-50/70 flex items-center gap-2 focus-within:bg-white focus-within:border-amber-500/50 transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder="Search symbol or name (e.g. kg, liter)..."
              className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-900 placeholder:text-slate-400"
              aria-label="Filter units of measure"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-sm"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Grouped Unit List */}
          <div 
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-label="Available units of measure"
            className="max-h-52 overflow-y-auto divide-y divide-slate-100 text-sm"
          >
            {groupedUnits.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 italic">
                No units match &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              groupedUnits.map((group) => {
                return (
                  <div key={group.category} className="py-1">
                    {/* Category Group Header */}
                    <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50 sticky top-0">
                      {group.category}
                    </div>

                    {/* Unit Options within Category */}
                    <div className="py-0.5">
                      {group.units.map((unit) => {
                        const isSelected = value.toLowerCase() === unit.symbol.toLowerCase();
                        const optionIndex = flatVisibleUnits.findIndex(
                          u => u.symbol.toLowerCase() === unit.symbol.toLowerCase()
                        );
                        const isHighlighted = highlightedIndex === optionIndex;

                        return (
                          <button
                            key={unit.symbol}
                            type="button"
                            role="option"
                            data-option-index={optionIndex}
                            aria-selected={isSelected}
                            onClick={() => handleSelectUnit(unit)}
                            onMouseEnter={() => setHighlightedIndex(optionIndex)}
                            className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected ? 'bg-amber-50/90 text-amber-950 font-medium' : ''
                            } ${
                              isHighlighted && !isSelected ? 'bg-slate-100 text-slate-900' : ''
                            } ${
                              !isSelected && !isHighlighted ? 'text-slate-700 hover:bg-slate-50' : ''
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span className="font-mono font-semibold text-slate-900 w-9 shrink-0">
                                {unit.symbol}
                              </span>
                              <span className="text-slate-600 truncate">
                                {unit.name}
                              </span>
                            </span>

                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-2" aria-hidden="true" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 flex justify-between items-center">
            <span>{flatVisibleUnits.length} units available</span>
            <span>Use ↑↓ to navigate, ↵ to select</span>
          </div>
        </div>
      )}
    </div>
  );
};
