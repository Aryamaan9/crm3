import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Database, PlusCircle } from 'lucide-react';

interface ImportMapperModalProps {
  csvHeaders: string[];
  csvData: string[][];
  existingFields: { id: string; label: string; type: string }[];
  onCancel: () => void;
  onConfirm: (mapping: Record<string, string>, newFields: { id: string; label: string; type: string }[]) => void;
}

export function ImportMapperModal({ csvHeaders, csvData, existingFields, onCancel, onConfirm }: ImportMapperModalProps) {
  // mapping: csvHeader -> existingFieldId OR '__NEW__'
  const [mapping, setMapping] = useState<Record<string, string>>({});
  // newFieldTypes: csvHeader -> 'text' | 'number' | 'date'
  const [newFieldTypes, setNewFieldTypes] = useState<Record<string, string>>({});

  // Auto-detect types based on first few rows
  useEffect(() => {
    const initialMapping: Record<string, string> = {};
    const initialTypes: Record<string, string> = {};
    
    csvHeaders.forEach((header, colIdx) => {
      // Try to auto-match existing field by name (case insensitive)
      const match = existingFields.find(f => f.label.toLowerCase() === header.trim().toLowerCase() || f.id.toLowerCase() === header.trim().toLowerCase());
      if (match) {
        initialMapping[header] = match.id;
      } else {
        initialMapping[header] = '__NEW__';
        // Auto detect type from first data row
        const sampleVal = csvData[0]?.[colIdx]?.trim() || "";
        if (!sampleVal) {
          initialTypes[header] = 'text';
        } else if (!isNaN(Number(sampleVal))) {
          initialTypes[header] = 'number';
        } else if (!isNaN(Date.parse(sampleVal))) {
          initialTypes[header] = 'date';
        } else {
          initialTypes[header] = 'text';
        }
      }
    });
    setMapping(initialMapping);
    setNewFieldTypes(initialTypes);
  }, [csvHeaders, existingFields, csvData]);

  const handleConfirm = () => {
    const newFieldsToCreate: { id: string; label: string; type: string }[] = [];
    const finalMapping: Record<string, string> = {};

    csvHeaders.forEach(header => {
      const mappedTo = mapping[header];
      if (mappedTo === '__NEW__') {
        // Generate an ID for the new field
        const newId = header.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
        newFieldsToCreate.push({
          id: newId,
          label: header.trim(),
          type: newFieldTypes[header] || 'text'
        });
        finalMapping[header] = newId;
      } else if (mappedTo && mappedTo !== '__SKIP__') {
        finalMapping[header] = mappedTo;
      }
    });

    onConfirm(finalMapping, newFieldsToCreate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Map CSV Columns</h2>
              <p className="text-sm text-slate-500">Match your CSV columns to CRM fields.</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 bg-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <div className="col-span-4">CSV Column (Sample Data)</div>
              <div className="col-span-1 text-center"></div>
              <div className="col-span-4">Map To CRM Field</div>
              <div className="col-span-3">Data Type (If New)</div>
            </div>
            
            <div className="divide-y divide-slate-100 bg-white">
              {csvHeaders.map((header, idx) => {
                const sampleData = csvData[0]?.[idx] || "No data";
                const isNew = mapping[header] === '__NEW__';
                
                return (
                  <div key={idx} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors">
                    <div className="col-span-4 min-w-0">
                      <p className="font-medium text-slate-900 truncate" title={header}>{header}</p>
                      <p className="text-xs text-slate-500 truncate" title={sampleData}>Ex: {sampleData}</p>
                    </div>
                    
                    <div className="col-span-1 flex justify-center text-slate-300">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    
                    <div className="col-span-4">
                      <select 
                        value={mapping[header] || '__SKIP__'} 
                        onChange={(e) => setMapping(prev => ({ ...prev, [header]: e.target.value }))}
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                      >
                        <option value="__SKIP__">-- Skip this column --</option>
                        <option value="__NEW__">✨ Create New Field</option>
                        <optgroup label="Standard Fields">
                          <option value="firstName">First Name</option>
                          <option value="lastName">Last Name</option>
                          <option value="organization">Organization</option>
                          <option value="email">Email</option>
                          <option value="investorType">Investor Type</option>
                          <option value="leadStage">Lead Stage</option>
                        </optgroup>
                        {existingFields.filter(f => !['firstName','lastName','organization','email','investorType','leadStage'].includes(f.id)).length > 0 && (
                          <optgroup label="Custom Fields">
                            {existingFields
                              .filter(f => !['firstName','lastName','organization','email','investorType','leadStage'].includes(f.id))
                              .map(f => (
                                <option key={f.id} value={f.id}>{f.label}</option>
                              ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                    
                    <div className="col-span-3">
                      {isNew ? (
                        <select
                          value={newFieldTypes[header] || 'text'}
                          onChange={(e) => setNewFieldTypes(prev => ({ ...prev, [header]: e.target.value }))}
                          className="w-full text-sm px-3 py-2 border border-blue-200 bg-blue-50 text-blue-900 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                        </select>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Determined by field</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
            Cancel Import
          </button>
          <button onClick={handleConfirm} className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shadow-sm">
            <PlusCircle className="w-4 h-4" /> Confirm & Import {csvData.length} Rows
          </button>
        </div>
      </div>
    </div>
  );
}
