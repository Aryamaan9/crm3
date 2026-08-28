import React, { useState } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { Lead } from '@/hooks/useLeads';
import { GlobalSettings } from '@/hooks/useSettings';
import { Mail, Send, Eye, Code, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmailComposerProps {
  onClose: () => void;
  selectedLeads: Set<string>;
  leadsData: Lead[];
  settings: GlobalSettings | null;
  recordCampaign: (data: any) => Promise<string>;
}

const TAGS = [
  { tag: "{{first_name}}", label: "First Name" },
  { tag: "{{last_name}}", label: "Last Name" },
  { tag: "{{organization}}", label: "Organization" },
  { tag: "{{email}}", label: "Email" },
  { tag: "{{investor_type}}", label: "Investor Type" },
  { tag: "{{lead_stage}}", label: "Lead Stage" },
];

export function EmailComposer({ onClose, selectedLeads, leadsData, settings, recordCampaign }: EmailComposerProps) {
  const [campaignName, setCampaignName] = useState("");
  const [senderName, setSenderName] = useState("Investor Relations");
  const [senderEmail, setSenderEmail] = useState("info@moneystories.in");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("<p>Dear {{first_name}},</p><p><br></p><p>We have a new update for <strong>{{organization}}</strong>.</p><p><br></p><p>Warm regards,<br>The Team</p>");
  
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const recipients = leadsData.filter(l => selectedLeads.has(l.id));
  const previewLead = recipients[0] || { firstName: 'John', lastName: 'Doe', organization: 'Acme Corp', email: 'john@example.com', investorType: 'Angel', leadStage: 'Cold' };

  // Generate live preview
  let previewHtml = body;
  TAGS.forEach(t => {
    const key = t.tag.replace(/[{}]/g, '');
    const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
    previewHtml = previewHtml.replace(new RegExp(t.tag, 'g'), previewLead[camelKey as keyof typeof previewLead] || t.label);
  });

  const handleSend = async () => {
    if (!settings?.emailConfig?.brevoApiKey) {
      return toast.error("Brevo API Key is missing in Global Settings.");
    }
    if (!campaignName || !subject || !body) {
      return toast.error("Please fill in all fields.");
    }
    if (recipients.length === 0) {
      return toast.error("No recipients selected.");
    }

    setIsSending(true);
    setProgress({ current: 0, total: recipients.length });

    try {
      // We will batch in chunks of 50 to avoid Brevo payload limits
      const chunkSize = 50;
      let successCount = 0;

      for (let i = 0; i < recipients.length; i += chunkSize) {
        const chunk = recipients.slice(i, i + chunkSize);
        
        // Convert our custom tags {{first_name}} to Brevo params {{params.first_name}}
        let brevoHtml = body;
        TAGS.forEach(t => {
          const key = t.tag.replace(/[{}]/g, '');
          brevoHtml = brevoHtml.replace(new RegExp(t.tag, 'g'), `{{params.${key}}}`);
        });

        const messageVersions = chunk.map(lead => {
          return {
            to: [{ email: lead.email, name: `${lead.firstName} ${lead.lastName}` }],
            params: {
              first_name: lead.firstName || '',
              last_name: lead.lastName || '',
              organization: lead.organization || '',
              email: lead.email || '',
              investor_type: lead.investorType || '',
              lead_stage: lead.leadStage || ''
            }
          };
        });

        const payload = {
          sender: { name: senderName, email: senderEmail },
          subject: subject,
          htmlContent: brevoHtml,
          messageVersions: messageVersions
        };

        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': settings.emailConfig.brevoApiKey,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          console.error("Brevo API Error:", errorData);
          throw new Error(`Brevo API Error: ${res.statusText}`);
        }

        successCount += chunk.length;
        setProgress({ current: successCount, total: recipients.length });
      }

      await recordCampaign({
        campaignName,
        subject,
        sender: `${senderName} <${senderEmail}>`,
        recipientIds: recipients.map(r => r.id),
        status: 'sent',
        successCount
      });

      toast.success(`Successfully dispatched to ${successCount} recipients!`);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to send campaign");
      
      await recordCampaign({
        campaignName,
        subject,
        sender: `${senderName} <${senderEmail}>`,
        recipientIds: recipients.map(r => r.id),
        status: 'failed',
        successCount: progress.current
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-6rem)] animate-in fade-in zoom-in-95 duration-200 fixed inset-8 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded shadow-sm border border-slate-200">
            <Mail className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">Composer</h2>
            <p className="text-xs text-slate-500">Sending to {recipients.length} recipients</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Split Pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Editor */}
        <div className="w-1/2 flex flex-col border-r border-slate-100 bg-white overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign Name (Internal)</label>
              <input 
                type="text" 
                value={campaignName} onChange={e => setCampaignName(e.target.value)}
                placeholder="e.g. Q1 Newsletter"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sender Name</label>
                <input 
                  type="text" 
                  value={senderName} onChange={e => setSenderName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-900"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sender Email</label>
                <input 
                  type="email" 
                  value={senderEmail} onChange={e => setSenderEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Line</label>
              <input 
                type="text" 
                value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="Exciting updates for {{organization}}"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[300px]">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Body</label>
            <RichTextEditor value={body} onChange={setBody} tags={TAGS} />
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="w-1/2 flex flex-col bg-slate-50 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-100 flex items-center gap-2 shrink-0">
            <Eye className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Live Preview</span>
            <span className="text-xs text-slate-400 ml-auto">Previewing as: {previewLead?.firstName || 'Unknown'}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 flex justify-center">
            <div className="w-full max-w-lg bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden self-start">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 space-y-1">
                <div className="text-xs text-slate-500"><span className="font-semibold text-slate-700">From:</span> {senderName} &lt;{senderEmail}&gt;</div>
                <div className="text-xs text-slate-500"><span className="font-semibold text-slate-700">To:</span> {previewLead?.firstName} &lt;{previewLead?.email}&gt;</div>
                <div className="text-sm font-bold text-slate-900 pt-2">{subject.replace(/{{organization}}/g, previewLead?.organization || 'Organization')}</div>
              </div>
              <div 
                className="p-6 prose prose-sm prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-6 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              {!settings?.emailConfig?.brevoApiKey && (
                <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Brevo API Key missing</span>
              )}
            </div>
            <button 
              onClick={handleSend}
              disabled={isSending || !settings?.emailConfig?.brevoApiKey}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl flex items-center gap-2"
            >
              {isSending ? (
                `Sending... ${progress.current}/${progress.total}`
              ) : (
                <><Send className="w-4 h-4" /> Dispatch Campaign</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
