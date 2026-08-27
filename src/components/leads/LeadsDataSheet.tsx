import React, { useMemo } from 'react';
import { DataSheetGrid, textColumn, keyColumn, isoDateColumn } from 'react-datasheet-grid';
import 'react-datasheet-grid/dist/style.css';
import { Timestamp, doc, updateDoc, addDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export function LeadsDataSheet({ leads, setLeads, columns, settings }: any) {
  const { user } = useAuth();
  
  // Map internal grid column shorthands to actual Firestore field names
  const FIELD_MAP: Record<string, string> = {
    'org': 'organization',
    'type': 'investorType',
    'stage': 'leadStage',
    'interaction': 'lastInteraction',
    'followup': 'followUpDate',
    'owner': 'primaryOwner'
  };

  // Transform columns into react-datasheet-grid columns
  const gridColumns = useMemo(() => {
    return columns.filter((c: any) => c.visible).map((c: any) => {
      let colType = textColumn;
      const fieldKey = FIELD_MAP[c.id] || c.id;
      
      // Determine if it's a date
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

  // Transform leads data for the grid
  // Firebase timestamps need to be converted to date strings for isoDateColumn
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

  // Handle updates
  const handleChange = async (newData: any[]) => {
    const oldLeads = [...leads];
    const promises: any[] = [];
    const updatedLeads: any[] = [];
    let hasError = false;

    // 1. Detect and handle deletions
    const newIds = new Set(newData.map(n => n.id).filter(Boolean));
    oldLeads.forEach(oldLead => {
      if (!newIds.has(oldLead.id)) {
        promises.push(
          deleteDoc(doc(db, "leads", oldLead.id)).catch(e => {
            console.error("Failed to delete doc", e);
            hasError = true;
          })
        );
      }
    });

    // 2. Process new or updated rows
    for (let i = 0; i < newData.length; i++) {
      const newRow = newData[i];
      
      if (!newRow.id) {
        // It's a new row!
        const newDocData = {
          ...newRow,
          leadStage: newRow.leadStage || settings?.leadStages?.[0] || 'New',
          investorType: newRow.investorType || settings?.investorTypes?.[0] || 'Unknown',
          lastInteraction: Timestamp.now(),
          primaryOwner: user?.uid,
          createdAt: Timestamp.now()
        };
        
        // Remove undefined fields
        Object.keys(newDocData).forEach(key => newDocData[key] === undefined && delete newDocData[key]);
        
        updatedLeads.push(newDocData); // Optimistic ID will be missing, we update it after
        promises.push(
          addDoc(collection(db, "leads"), newDocData).then(ref => {
            newDocData.id = ref.id;
          })
        );
      } else {
        // Existing row, locate it in oldLeads by ID
        const oldRow = oldLeads.find(l => l.id === newRow.id);
        if (!oldRow) {
           updatedLeads.push(newRow);
           continue; 
        }

        const updates: any = {};
        let changed = false;
        
        Object.keys(newRow).forEach(key => {
          if (key === 'id') return;
          if (newRow[key] !== oldRow[key]) {
             // Basic date handling
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
        
        // Push optimistic
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
    
    // Set leads optimistically
    setLeads(updatedLeads);
    
    if (promises.length > 0) {
      toast.promise(Promise.all(promises), {
        loading: 'Saving...',
        success: 'Saved successfully',
        error: 'Error saving data'
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
