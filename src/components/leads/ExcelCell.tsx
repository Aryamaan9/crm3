import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface ExcelCellProps {
  value: any;
  colId: string;
  rowIndex: number;
  colIndex: number;
  type?: 'text' | 'number' | 'date' | 'select';
  options?: string[];
  onChange: (colId: string, value: any) => void;
  readOnly?: boolean;
}

export function ExcelCell({
  value,
  colId,
  rowIndex,
  colIndex,
  type = 'text',
  options = [],
  onChange,
  readOnly = false
}: ExcelCellProps) {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    // Sync local state if parent value changes
    setLocalValue(value || '');
  }, [value]);

  const handleBlur = () => {
    if (localValue !== (value || '')) {
      onChange(colId, localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    const target = e.target as HTMLInputElement;
    
    // Allow enter to save and move down
    if (e.key === 'Enter') {
      e.preventDefault();
      target.blur(); // Trigger blur to save
      const next = document.querySelector(`[data-coord="${rowIndex + 1}-${colIndex}"]`) as HTMLElement;
      if (next) next.focus();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = document.querySelector(`[data-coord="${rowIndex + 1}-${colIndex}"]`) as HTMLElement;
      if (next) next.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = document.querySelector(`[data-coord="${rowIndex - 1}-${colIndex}"]`) as HTMLElement;
      if (prev) prev.focus();
    } else if (e.key === 'ArrowRight') {
      // Only navigate if at end of text (for text inputs) or it's a select
      if (type === 'select' || type === 'date' || target.selectionStart === target.value.length) {
        e.preventDefault();
        const next = document.querySelector(`[data-coord="${rowIndex}-${colIndex + 1}"]`) as HTMLElement;
        if (next) next.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      // Only navigate if at start of text or it's a select
      if (type === 'select' || type === 'date' || target.selectionStart === 0) {
        e.preventDefault();
        const prev = document.querySelector(`[data-coord="${rowIndex}-${colIndex - 1}"]`) as HTMLElement;
        if (prev) prev.focus();
      }
    }
  };

  let displayValue = localValue;
  if (type === 'date' && localValue && localValue.toDate) {
    displayValue = format(localValue.toDate(), 'yyyy-MM-dd');
  } else if (localValue && localValue.toDate) {
    displayValue = format(localValue.toDate(), "MMM d, yyyy");
  }

  if (readOnly) {
    return (
      <div className="w-full h-full px-2 py-1.5 text-sm text-slate-500 bg-slate-50/50 cursor-not-allowed">
        {displayValue || '-'}
      </div>
    );
  }

  if (type === 'select') {
    return (
      <select
        data-coord={`${rowIndex}-${colIndex}`}
        value={displayValue}
        onChange={e => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full h-full px-2 py-1.5 text-sm bg-transparent border-2 border-transparent outline-none focus:border-blue-500 focus:bg-blue-50 transition-colors appearance-none cursor-pointer"
      >
        <option value="">-</option>
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  }

  return (
    <input
      data-coord={`${rowIndex}-${colIndex}`}
      type={type}
      value={displayValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="w-full h-full px-2 py-1.5 text-sm bg-transparent border-2 border-transparent outline-none focus:border-blue-500 focus:bg-blue-50 transition-colors"
    />
  );
}
