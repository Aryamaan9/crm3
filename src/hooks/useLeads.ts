import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  leadStage: string;
  investorType: string;
  followUpDate?: any;
  lastInteraction?: any;
  primaryOwner?: string;
  createdAt?: any;
  [key: string]: any;
}

export function useLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      
      if (user?.role === 'junior') {
        setLeads(data.filter(l => l.primaryOwner === user.uid));
      } else {
        setLeads(data);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching leads:', err);
      setError('Failed to fetch leads');
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user, fetchLeads]);

  const addLead = async (leadData: Partial<Lead>) => {
    try {
      const newLead = {
        ...leadData,
        primaryOwner: user?.uid,
        createdAt: Timestamp.now(),
        lastInteraction: Timestamp.now(),
      };
      const ref = await addDoc(collection(db, 'leads'), newLead);
      setLeads(prev => [{ id: ref.id, ...newLead } as Lead, ...prev]);
      return ref.id;
    } catch (err) {
      console.error('Error adding lead:', err);
      throw err;
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      await updateDoc(doc(db, 'leads', id), updates);
      setLeads(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)));
    } catch (err) {
      console.error('Error updating lead:', err);
      throw err;
    }
  };

  const removeLead = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'leads', id));
      setLeads(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error('Error deleting lead:', err);
      throw err;
    }
  };

  return { leads, setLeads, loading, error, fetchLeads, addLead, updateLead, removeLead };
}
