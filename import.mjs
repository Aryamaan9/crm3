import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import fs from 'fs';
import Papa from 'papaparse';

const firebaseConfig = { apiKey: "AIzaSyDsCldiDM2jUaTimZ3yBSzdqk51yEGtZEU", authDomain: "mscrm3-a777e.firebaseapp.com", projectId: "mscrm3-a777e", storageBucket: "mscrm3-a777e.firebasestorage.app", messagingSenderId: "73264060901", appId: "1:73264060901:web:63c37f0a7436ac1c4ab70c" };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log("Reading CSV...");
  const csvText = fs.readFileSync('public/zoho_leads.csv', 'utf-8');
  
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  console.log(`Parsed ${parsed.data.length} rows.`);

  console.log("Fetching existing leads...");
  const leadsRef = collection(db, "leads");
  const snap = await getDocs(leadsRef);
  console.log(`Found ${snap.size} existing leads. Deleting...`);
  
  let batch = writeBatch(db);
  let count = 0;
  
  for (const docSnap of snap.docs) {
    batch.delete(docSnap.ref);
    count++;
    if (count % 500 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  if (count % 500 !== 0) {
    await batch.commit();
  }
  
  console.log("Mock data deleted. Inserting new data...");
  
  batch = writeBatch(db);
  count = 0;
  
  for (const row of parsed.data) {
    const newDocRef = doc(leadsRef); // auto ID
    const lead = {
      email: row['Lead Email'] || '',
      firstName: row['First Name'] || '',
      lastName: row['Last Name'] || '',
      organization: row['Company Name'] || '',
      investorType: row['Industry (Zoho CRM)'] || '',
      leadStage: row['Lead stage'] || '',
      primaryOwner: row['Contact Owner'] || row['Account owner (Zoho CRM)'] || '',
      currentCountry: row['Current Country'] || '',
      lastInteraction: row['Last Reach Out'] || '',
      followUpDate: row['Reach out Date'] || '',
      // Add a few more mapped fields
      phone: row['Phone'] || row['Mobile'] || '',
      city: row['City'] || '',
      website: row['Website address'] || row['Website Address (Zoho CRM)'] || '',
      title: row['Title'] || '',
      jobTitle: row['Job title'] || '',
      createdAt: new Date().toISOString()
    };
    batch.set(newDocRef, lead);
    count++;
    if (count % 500 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  if (count % 500 !== 0) {
    await batch.commit();
  }
  
  console.log(`Imported ${count} new leads.`);
  process.exit(0);
}

run().catch(console.error);
