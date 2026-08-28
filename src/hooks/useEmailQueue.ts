import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  sender: string;
  recipientCount: number;
  status: 'sent' | 'failed' | 'processing';
  createdAt: any;
  successCount?: number;
}

export function useEmailQueue() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'email_queue'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
      setCampaigns(data);
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      toast.error('Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const recordCampaign = async (campaignData: Partial<Campaign>) => {
    try {
      const newCampaign = {
        ...campaignData,
        createdAt: Timestamp.now(),
      };
      const ref = await addDoc(collection(db, 'email_queue'), newCampaign);
      setCampaigns(prev => [{ id: ref.id, ...newCampaign } as Campaign, ...prev]);
      return ref.id;
    } catch (err) {
      console.error('Error recording campaign:', err);
      throw err;
    }
  };

  return { campaigns, setCampaigns, loading, fetchCampaigns, recordCampaign };
}
