import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

export interface GlobalSettings {
  leadStages: string[];
  investorTypes: string[];
  customFields: any[];
  emailConfig?: {
    apiKey?: string;
    senderEmail?: string;
  };
}

export function useSettings() {
  const [settings, setSettings] = useState<GlobalSettings>({
    leadStages: [],
    investorTypes: [],
    customFields: []
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'settings', 'global'));
      if (snap.exists()) {
        setSettings(snap.data() as GlobalSettings);
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, fetchSettings };
}
