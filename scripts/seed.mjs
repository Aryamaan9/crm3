import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const stages = ["New", "Initial Outreach", "Meeting Scheduled", "Due Diligence", "Closed Won", "Closed Lost"];
const types = ["Angel Investor", "Venture Capital", "Family Office", "Private Equity", "High Net Worth"];

async function seed() {
  console.log("Starting DB Seed...");
  
  // 1. Set Global Settings
  console.log("Seeding Settings...");
  await setDoc(doc(db, "settings", "global"), {
    leadStages: stages,
    investorTypes: types
  });

  // 2. Add 20 Demo Leads
  console.log("Seeding Leads...");
  const firstNames = ["Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah", "Ian", "Julia"];
  const lastNames = ["Smith", "Jones", "Williams", "Brown", "Taylor", "Davies", "Evans", "Wilson", "Thomas", "Roberts"];
  const orgs = ["Sequoia", "a16z", "Lightspeed", "Benchmark", "Founders Fund", "Index", "Accel", "Greylock", "Bessemer", "KPCB"];
  
  for(let i=0; i<20; i++) {
    const isClosedWon = i % 5 === 0;
    const stage = isClosedWon ? "Closed Won" : stages[Math.floor(Math.random() * (stages.length - 1))];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Some dates in the past, some in the future
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + (Math.floor(Math.random() * 14) - 5)); // -5 to +9 days

    await addDoc(collection(db, "leads"), {
      firstName: firstNames[i % 10],
      lastName: lastNames[(i + 3) % 10],
      organization: orgs[i % 10],
      email: `demo${i}@example.com`,
      investorType: type,
      leadStage: stage,
      followUpDate: Timestamp.fromDate(followUpDate),
      lastInteraction: Timestamp.now(),
      primaryOwner: "system-seed", 
      createdAt: Timestamp.now()
    });
  }

  // 3. Add Demo Distributors
  console.log("Seeding Distributors...");
  await addDoc(collection(db, "distributors"), {
    name: "Global Wealth Partners",
    contactPerson: "Michael Scott",
    email: "michael@gwp.com",
    notes: "Key placement agent for Europe",
    createdAt: Timestamp.now()
  });

  console.log("Database successfully seeded with demo data!");
  process.exit(0);
}

seed().catch(console.error);
