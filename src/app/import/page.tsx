"use client";

import { useState } from "react";
import { collection, getDocs, writeBatch, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Papa from "papaparse";
import toast from "react-hot-toast";

export default function ImportPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleImport = async () => {
    if (!user) return toast.error("Must be logged in");
    if (!file) return toast.error("Please select a CSV file first");
    
    setLoading(true);
    setProgress("Reading CSV file...");

    try {
      const text = await file.text();
      setProgress("Parsing CSV...");

      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      setProgress(`Parsed ${parsed.data.length} rows. Deleting existing data...`);

      const leadsRef = collection(db, "leads");
      const snap = await getDocs(leadsRef);
      
      let batch = writeBatch(db);
      let count = 0;
      
      for (const docSnap of snap.docs) {
        batch.delete(docSnap.ref);
        count++;
        if (count % 400 === 0) {
          await batch.commit();
          batch = writeBatch(db);
        }
      }
      if (count > 0 && count % 400 !== 0) {
        await batch.commit();
      }

      setProgress("Mock data deleted. Inserting new data...");
      
      batch = writeBatch(db);
      count = 0;
      
      for (const row of parsed.data as any[]) {
        const newDocRef = doc(leadsRef);
        
        let lastInteraction = null;
        if (row['Last Reach Out'] && row['Last Reach Out'].trim() !== '') {
           try { lastInteraction = Timestamp.fromDate(new Date(row['Last Reach Out'])); } catch (e) {}
        }
        
        let followUpDate = null;
        if (row['Reach out Date'] && row['Reach out Date'].trim() !== '') {
           try { followUpDate = Timestamp.fromDate(new Date(row['Reach out Date'])); } catch (e) {}
        }
        
        const lead = {
          email: row['Lead Email'] || '',
          firstName: row['First Name'] || '',
          lastName: row['Last Name'] || '',
          organization: row['Company Name'] || '',
          investorType: row['Industry (Zoho CRM)'] || '',
          leadStage: row['Lead stage'] || '',
          primaryOwner: row['Contact Owner'] || row['Account owner (Zoho CRM)'] || '',
          currentCountry: row['Current Country'] || '',
          lastInteraction: lastInteraction || Timestamp.now(),
          followUpDate: followUpDate,
          
          title: row['Title'] || '',
          jobTitle: row['Job title'] || '',
          phone: row['Phone'] || row['Mobile'] || '',
          city: row['City'] || '',
          website: row['Website address'] || row['Website Address (Zoho CRM)'] || '',
          createdAt: Timestamp.now()
        };
        batch.set(newDocRef, lead);
        count++;
        if (count % 400 === 0) {
          await batch.commit();
          batch = writeBatch(db);
        }
      }
      if (count > 0 && count % 400 !== 0) {
        await batch.commit();
      }

      setProgress(`Successfully imported ${count} new leads!`);
      toast.success("Import Complete!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
      setProgress("Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto mt-20 bg-white rounded shadow text-center">
      <h1 className="text-2xl font-bold mb-4">Import CSV Data</h1>
      <p className="text-gray-600 mb-6">
        Select a CSV file to import. <strong>Warning:</strong> This will wipe all existing leads in the database!
      </p>
      
      <div className="mb-6">
        <input 
          type="file" 
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100 border border-slate-200 rounded p-2"
        />
      </div>

      <button 
        onClick={handleImport} 
        disabled={loading || !file}
        className="px-6 py-2 bg-blue-600 text-white rounded font-medium disabled:opacity-50"
      >
        {loading ? "Importing..." : "Run Import"}
      </button>
      {progress && <p className="mt-4 font-mono text-sm text-gray-800">{progress}</p>}
    </div>
  );
}
