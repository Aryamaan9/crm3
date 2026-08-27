import React, { useMemo } from 'react';
import { DataSheetGrid, textColumn, keyColumn, isoDateColumn } from 'react-datasheet-grid';
import 'react-datasheet-grid/dist/style.css';
import { Timestamp, doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export function LeadsDataSheet({ leads, setLeads, columns, settings }: any) {
  const { user } = useAuth();
  
  // Transform columns into react-datasheet-grid columns
  const gridColumns = useMemo(() => {
    return columns.filter((c: any) => c.visible).map((c: any) => {
      // By default use textColumn
      let colType = textColumn;
      
      // Determine if it's a date
      if (c.id === 'followup' || c.id === 'interaction') {
        colType = isoDateColumn; // We might need to map firebase timestamps to ISO dates
      }

      return {
        ...keyColumn(c.id, colType),
        title: c.label,
        // Make readOnly if it's owner or interaction
        disabled: c.id === 'owner' || c.id === 'interaction'
      };
    });
  }, [columns]);

  // Transform leads data for the grid
  // Firebase timestamps need to be converted to date strings for isoDateColumn
  const gridData = useMemo(() => {
    return leads.map((lead: any) => {
      const row = { ...lead };
      if (row.followup?.toDate) {
        row.followup = row.followup.toDate().toISOString().split('T')[0];
      }
      if (row.interaction?.toDate) {
        row.interaction = row.interaction.toDate().toISOString().split('T')[0];
      }
      return row;
    });
  }, [leads]);

  // Handle updates
  const handleChange = async (newData: any[]) => {
    // Determine what changed
    // react-datasheet-grid passes the entire new array
    const oldLeads = [...leads];
    
    // We will do optimistic UI updates but we also need to fire off Firebase updates
    // For simplicity, we can find the diffs
    const promises = [];
    const updatedLeads = [];
    
    let hasError = false;

    for (let i = 0; i < newData.length; i++) {
      const newRow = newData[i];
      const oldRow = oldLeads[i];
      
      if (!oldRow) {
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
        // Existing row, check for diffs
        const updates: any = {};
        let changed = false;
        
        Object.keys(newRow).forEach(key => {
          if (key === 'id') return;
          if (newRow[key] !== oldRow[key]) {
             // Basic date handling
             if (key === 'followup' || key === 'interaction') {
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
