import React, { useMemo, useRef, useEffect } from 'react';
import { DataSheetGrid, textColumn, keyColumn, isoDateColumn } from 'react-datasheet-grid';
import 'react-datasheet-grid/dist/style.css';
import { Timestamp, doc, updateDoc, setDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export function LeadsDataSheet({ leads, setLeads, columns, settings }: any) {
  const { user } = useAuth();
  const leadsRef = useRef(leads);
  
  // Keep ref in sync to avoid stale closures during rapid cell edits
  useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);
  
  const FIELD_MAP: Record<string, string> = {
    'org': 'organization',
    'type': 'investorType',
    'stage': 'leadStage',
    'interaction': 'lastInteraction',
    'followup': 'followUpDate',
    'owner': 'primaryOwner'
  };

  const gridColumns = useMemo(() => {
    return columns.filter((c: any) => c.visible).map((c: any) => {
      let colType = textColumn;
      const fieldKey = FIELD_MAP[c.id] || c.id;
      if (fieldKey === 'followUpDate' || fieldKey === 'lastInteraction') {
        colType = isoDateColumn;
      }
      return {
        ...keyColumn(fieldKey, colType),
        title: c.label,
        disabled: fieldKey === 'primaryOwner' || fieldKey === 'lastInteraction'
      };
    });
  }, [columns]);

  const gridData = useMemo(() => {
    return leads.map((lead: any) => {
      const row = { ...lead };
      if (row.followUpDate?.toDate) {
        row.followUpDate = row.followUpDate.toDate().toISOString().split('T')[0];
      }
      if (row.lastInteraction?.toDate) {
        row.lastInteraction = row.lastInteraction.toDate().toISOString().split('T')[0];
      }
      return row;
    });
  }, [leads]);

  const handleChange = async (newData: any[]) => {
    const oldLeads = leadsRef.current;
    const promises: any[] = [];
    const updatedLeads: any[] = [];
    let hasError = false;

    // Deduplicate IDs (Fixes bug where drag-to-fill copies the row ID)
    const seenIds = new Set<string>();
    const deduplicatedData = newData.map(row => {
      if (row.id && seenIds.has(row.id)) {
        // Strip duplicate ID to treat as a new row
        const { id, ...rest } = row;
        return rest;
      }
      if (row.id) seenIds.add(row.id);
      return row;
    });

    // 1. Detect deletions
    oldLeads.forEach((oldLead: any) => {
      if (!seenIds.has(oldLead.id)) {
        promises.push(
          deleteDoc(doc(db, "leads", oldLead.id)).catch(e => {
            console.error("Failed to delete doc", e);
            hasError = true;
          })
        );
      }
    });

    // 2. Process rows
    for (let i = 0; i < deduplicatedData.length; i++) {
      const newRow = deduplicatedData[i];
      
      if (!newRow.id) {
        // Generate ID immediately client-side to prevent race conditions
        const newDocRef = doc(collection(db, "leads"));
        const newDocData = {
          ...newRow,
          id: newDocRef.id,
          leadStage: newRow.leadStage || settings?.leadStages?.[0] || 'New',
          investorType: newRow.investorType || settings?.investorTypes?.[0] || 'Unknown',
          lastInteraction: Timestamp.now(),
          primaryOwner: user?.uid,
          createdAt: Timestamp.now()
        };
        
        Object.keys(newDocData).forEach(key => newDocData[key] === undefined && delete newDocData[key]);
        
        updatedLeads.push(newDocData);
        promises.push(
          setDoc(newDocRef, newDocData).catch(() => { hasError = true; })
        );
      } else {
        const oldRow = oldLeads.find((l: any) => l.id === newRow.id);
        if (!oldRow) {
           updatedLeads.push(newRow);
           continue; 
        }

        const updates: any = {};
        let changed = false;
        
        Object.keys(newRow).forEach(key => {
          if (key === 'id') return;
          if (newRow[key] !== oldRow[key]) {
             if (key === 'followUpDate' || key === 'lastInteraction') {
                if (newRow[key] && typeof newRow[key] === 'string') {
                   const d = new Date(newRow[key]);
                   if (!isNaN(d.getTime())) {
                      updates[key] = Timestamp.fromDate(d);
                      changed = true;
                   }
                }
             } else {
                updates[key] = newRow[key];
                changed = true;
             }
          }
        });
        
        const updatedRow = { ...oldRow, ...updates };
        updatedLeads.push(updatedRow);
        
        if (changed) {
          promises.push(updateDoc(doc(db, "leads", oldRow.id), updates).catch(e => {
            console.error("Failed to update doc", e);
            hasError = true;
          }));
        }
      }
    }
    
    // Set leads optimistically synchronously
    setLeads(updatedLeads);
    
    if (promises.length > 0) {
      toast.promise(Promise.all(promises), {
        loading: 'Saving changes...',
        success: 'Sync successful',
        error: 'Error syncing some cells'
      });
    }
  };

  return (
    <div className="flex-1 overflow-hidden" style={{ height: '500px' }}>
       <DataSheetGrid
         value={gridData}
         onChange={handleChange}
         columns={gridColumns}
         autoAddRow
         rowClassName={() => 'bg-white text-sm'}
       />
    </div>
  );
}
