import React, { useState, useEffect, useRef } from 'react';
import { Filter, SortAsc, SortDesc, Search, Check } from 'lucide-react';

interface LeadFilterMenuProps {
  label: string;
  uniqueValues: string[];
  selectedValues: Set<string>;
  onSort: (direction: 'asc' | 'desc' | null) => void;
  onFilterChange: (newSelected: Set<string>) => void;
}

export function LeadFilterMenu({ label, uniqueValues, selectedValues, onSort, onFilterChange }: LeadFilterMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredValues = uniqueValues.filter(v => v.toLowerCase().includes(search.toLowerCase()));
  const allSelected = filteredValues.length > 0 && filteredValues.every(v => selectedValues.has(v));

  const toggleAll = () => {
    const next = new Set(selectedValues);
    if (allSelected) {
      filteredValues.forEach(v => next.delete(v));
    } else {
      filteredValues.forEach(v => next.add(v));
    }
    onFilterChange(next);
  };

  const toggleValue = (val: string) => {
    const next = new Set(selectedValues);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    onFilterChange(next);
  };

  const isFiltered = selectedValues.size < uniqueValues.length;

  return (
    <div className="inline-block relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1 -ml-2 rounded hover:bg-slate-200 transition-colors ${isOpen || isFiltered ? 'text-slate-900 bg-slate-200/50' : 'text-slate-500'}`}
      >
        {label}
        <Filter className={`w-3.5 h-3.5 ${isFiltered ? 'fill-slate-900 text-slate-900' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden text-sm font-normal text-slate-700 font-sans">
          <div className="p-2 space-y-1 border-b border-slate-100 bg-slate-50">
            <button onClick={() => { onSort('asc'); setIsOpen(false); }} className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-slate-200 rounded text-left">
              <SortAsc className="w-4 h-4 text-slate-500" /> Sort A to Z
            </button>
            <button onClick={() => { onSort('desc'); setIsOpen(false); }} className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-slate-200 rounded text-left">
              <SortDesc className="w-4 h-4 text-slate-500" /> Sort Z to A
            </button>
          </div>
          
          <div className="p-2 border-b border-slate-100 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..." 
              className="w-full pl-8 pr-2 py-1.5 border border-slate-200 rounded-md text-xs outline-none focus:border-slate-400"
            />
          </div>

          <div className="max-h-48 overflow-y-auto p-2 space-y-0.5">
            <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
              <input 
                type="checkbox" 
                checked={allSelected} 
                onChange={toggleAll}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="font-medium text-slate-900">(Select All Search Results)</span>
            </label>
            {filteredValues.length === 0 ? (
              <div className="px-2 py-3 text-center text-xs text-slate-400 italic">No matches</div>
            ) : (
              filteredValues.map(val => (
                <label key={val} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedValues.has(val)}
                    onChange={() => toggleValue(val)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="truncate" title={val || "(Blanks)"}>{val || "(Blanks)"}</span>
                </label>
              ))
            )}
          </div>
          
          <div className="p-2 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button onClick={() => setIsOpen(false)} className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 transition-colors">
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
