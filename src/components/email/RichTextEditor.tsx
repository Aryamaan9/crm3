import React, { useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  tags: { tag: string; label: string }[];
}

export function RichTextEditor({ value, onChange, tags }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const exec = (cmd: string, val: string | undefined = undefined) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    onChange(editorRef.current?.innerHTML || '');
  };

  return (
    <div className="border border-slate-200 rounded-xl flex flex-col bg-white shadow-sm overflow-hidden h-full">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
        <button onClick={() => exec('bold')} className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded text-slate-700 font-bold transition-all" title="Bold">B</button>
        <button onClick={() => exec('italic')} className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded text-slate-700 italic font-serif transition-all" title="Italic">I</button>
        <button onClick={() => exec('underline')} className="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded text-slate-700 underline transition-all" title="Underline">U</button>
        <div className="w-px h-5 bg-slate-300 mx-1" />
        <button onClick={() => exec('insertUnorderedList')} className="px-3 h-8 flex items-center justify-center hover:bg-slate-200 rounded text-slate-700 text-xs font-medium transition-all" title="Bullet List">List</button>
        <button onClick={() => { const url = prompt('Enter URL (e.g. https://google.com)'); if (url) exec('createLink', url); }} className="px-3 h-8 flex items-center justify-center hover:bg-slate-200 rounded text-slate-700 text-xs font-medium transition-all" title="Link">Link</button>
        <div className="w-px h-5 bg-slate-300 mx-1" />
        <select onChange={(e) => { if(e.target.value) exec('insertText', e.target.value); e.target.value = ''; }} className="h-8 px-2 text-xs border border-slate-200 rounded bg-white text-slate-600 outline-none hover:border-slate-300 cursor-pointer">
          <option value="">✨ Insert Tag...</option>
          {tags.map(t => (<option key={t.tag} value={t.tag}>{t.label}</option>))}
        </select>
      </div>
      <div 
        ref={editorRef} 
        contentEditable 
        onInput={() => onChange(editorRef.current?.innerHTML || '')} 
        className="p-6 flex-1 min-h-[300px] outline-none prose prose-sm prose-slate max-w-none focus:bg-slate-50/30 transition-colors"
      />
    </div>
  );
}
